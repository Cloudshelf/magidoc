import type { marked } from 'marked'
import { parseNotification } from './components/Notification'
import { parseTags } from './components/Tags'

export type ContainerOptions = Record<string, boolean | string>

export default function (): marked.TokenizerExtension {
  return {
    name: 'container',
    level: 'block',
    start(src: string) {
      return src.match(/^:::[^:\n\s]/)?.index
    },
    tokenizer(src: string): marked.Tokens.Generic {
      const rule =
        /^:::(?<type>[a-z0-9-]+)(?<options>.*)?\n(?<content>(?:.|\n)*)\n:::(?:\n|$)/i

      const match = rule.exec(findRawContainer(src))
      if (!match || !match.groups) return null

      const type = match.groups.type.toLocaleLowerCase()
      const options = parseOptions(match.groups.options || '')
      const content = match.groups.content || ''

      let result: marked.Tokens.Generic | null

      switch (type) {
        case 'notification':
          result = parseNotification(match[0], options)
          break
        case 'tags':
          result = parseTags(match[0], content, options)
          break
        default:
          result = null
          break
      }

      if (result && result.tokens) {
        this.lexer.blockTokens(content, result.tokens)
      }

      return result
    },
  }
}

function findRawContainer(src: string): string | undefined {
  if (!src.startsWith(':::')) return undefined
  const lines = src.split('\n')
  let open = 1
  let lineNumber = 1

  for (lineNumber = 1; lineNumber < lines.length; lineNumber++) {
    const line = lines[lineNumber]
    if (line.startsWith(':::')) {
      if (/:::[^:\n\s]/.test(line)) {
        open++
      } else if (/^:::(\n|$)/.test(line)) {
        open -= 1
      }
    }

    if (open === 0) {
      break
    }
  }

  return lines.slice(0, lineNumber + 1).join('\n')
}

function parseOptions(options: string): ContainerOptions {
  const output = {}
  let remaining = options

  while (true) {
    const regex = /(?<name>[a-z0-9]+)(?:="(?<value>(?:.*?))")?/i
    const match = regex.exec(remaining)
    if (!match) break

    const name = match?.groups?.name

    if (name) {
      output[name] = match?.groups?.value ?? true
    }

    remaining = remaining.slice(match.index + match[0].length)
  }

  return output
}