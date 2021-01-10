import { useRouter } from 'next/router'
import { usePostQuery } from '../generated/graphql'
import { useGetIntId } from './useGetIntId'

export const useGetPostFromUrl = () => {
  const postId = useGetIntId()

  return usePostQuery({
    pause: postId === -1,
    variables: { id: postId },
  })
}
