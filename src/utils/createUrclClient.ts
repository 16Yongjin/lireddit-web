import { cacheExchange, Resolver } from '@urql/exchange-graphcache'
import {
  LoginMutation,
  MeQuery,
  MeDocument,
  RegisterMutation,
  LogoutMutation,
} from '../generated/graphql'
import { betterUpdateQuery } from './betterUpdateQuery'
import { pipe, tap } from 'wonka'
import {
  dedupExchange,
  Exchange,
  fetchExchange,
  stringifyVariables,
} from 'urql'
import Router from 'next/router'

const errorExchange: Exchange = ({ forward }) => (ops$) => {
  return pipe(
    forward(ops$),
    tap(({ error }) => {
      if (error) {
        console.log(error)
        if (error?.message.includes('not authenticated')) {
          Router.replace('/login')
        }
      }
    })
  )
}

export const cursorPagination = (): Resolver => {
  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info

    const allFields = cache.inspectFields(entityKey)
    const fieldInfos = allFields.filter((info) => info.fieldName === fieldName)
    const size = fieldInfos.length
    if (size === 0) {
      return undefined
    }
    const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`
    const isItIntTheCache = cache.resolve(
      cache.resolve(entityKey, fieldKey) as string,
      'posts'
    )
    info.partial = !isItIntTheCache

    let hasMore = true
    const posts = fieldInfos.flatMap((fi) => {
      const key = cache.resolve(entityKey, fi.fieldKey) as string
      const data = cache.resolve(key, 'posts')
      const _hasMore = cache.resolve(key, 'hasMore') as boolean
      if (!_hasMore) hasMore = _hasMore
      return data
    })

    console.log('posts', posts)

    return {
      __typename: 'PaginatedPosts',
      posts,
      hasMore,
    }
  }
}

export const createUrclClient = (ssrExchange: any) => ({
  url: 'http://localhost:4000/graphql',
  fetchOptions: {
    credentials: 'include' as const, // 요청 시 쿠키 포함
  },
  exchanges: [
    dedupExchange,
    cacheExchange({
      keys: {
        PaginatedPosts: () => null,
      },
      resolvers: {
        Query: {
          posts: cursorPagination(),
        },
      },
      // login, register 시 me 쿼리 캐시를 업데이트 함
      updates: {
        Mutation: {
          login: (_result, _args, cache, _info) => {
            betterUpdateQuery<LoginMutation, MeQuery>(
              cache,
              { query: MeDocument },
              _result,
              (result, query) => {
                if (result.login.errors) {
                  return query
                } else {
                  return {
                    me: result.login.user,
                  }
                }
              }
            )
          },
          register: (_result, _args, cache, _info) => {
            betterUpdateQuery<RegisterMutation, MeQuery>(
              cache,
              { query: MeDocument },
              _result,
              (result, query) => {
                if (result.register.errors) {
                  return query
                } else {
                  return {
                    me: result.register.user,
                  }
                }
              }
            )
          },
          logout: (_result, _args, cache, _info) => {
            betterUpdateQuery<LogoutMutation, MeQuery>(
              cache,
              { query: MeDocument },
              _result,
              () => ({ me: null })
            )
          },
        },
      },
    }),
    errorExchange,
    ssrExchange,
    fetchExchange,
  ],
})
