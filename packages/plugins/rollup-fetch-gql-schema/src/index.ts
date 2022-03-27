import type { Plugin, PluginContext } from 'rollup'
import queryGraphQLSchema from './schema/fetch.js'
import {writeFileSync} from 'fs'

export type PluginOptions = {
  /**
   * The URL the of the GraphQL API from which to fetch the GraphQL Schema using the introspection query.
   */
  url: string

  /**
   * The HTTP method used to call the GraphQL API. 
   * 
   * @default 'POST'
   */
  method?: string

  /**
   * A record of headers to pass inside the GraphQL Request performed to the server. Mostly useful when Authorization is required.
   *
   * @default {}
   */
  headers?: Record<string, string>

  /**
   * Indicates the target path for the JSON Schema resulting from the Query.
   *
   * @default static/_schema.json
   */
  target?: string
}

export default function fetchGraphQLSchema(options: PluginOptions): Plugin {
  async function setSchema(this: PluginContext) {
    const schema = await queryGraphQLSchema(options.url, options.method, options.headers)
    writeFileSync(options.target || 'static/_schema.json', JSON.stringify(schema))
  }

  return {
    name: 'fetch-graphql-schema',
    buildStart: async function () {
      await setSchema.bind(this)()
    },
  }
}
