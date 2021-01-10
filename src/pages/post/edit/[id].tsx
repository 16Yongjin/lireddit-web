import React from 'react'
import { withUrqlClient } from 'next-urql'
import { createUrqlClient } from '../../../utils/createUrqlClient'
import { Box, Button } from '@chakra-ui/react'
import { Formik, Form } from 'formik'
import { InputField } from '../../../components/InputField'
import { Layout } from '../../../components/Layout'
import { useGetPostFromUrl } from '../../../utils/useGetPostFromUrl'
import { useUpdatePostMutation } from '../../../generated/graphql'
import { useRouter } from 'next/router'
import { useGetIntId } from '../../../utils/useGetIntId'

const EditPost = () => {
  const router = useRouter()
  const postId = useGetIntId()
  const [{ data, error, fetching }] = useGetPostFromUrl()
  const [, updatePost] = useUpdatePostMutation()

  if (fetching) {
    return (
      <Layout>
        <div>loading...</div>
      </Layout>
    )
  }

  if (error) {
    return <div>{error.message}</div>
  }

  if (!data?.post) {
    return (
      <Layout>
        <Box>글을 찾을 수 없습니다.</Box>
      </Layout>
    )
  }

  return (
    <Layout variant="small">
      <Formik
        initialValues={{ title: data.post.title, text: data.post.text }}
        onSubmit={async (values) => {
          await updatePost({ id: postId, ...values })
          router.push('/')
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField name="title" placeholder="title" label="Title" />
            <Box mt={4}>
              <InputField
                textarea
                name="text"
                placeholder="text..."
                label="Body"
              />
            </Box>

            <Button
              mt={4}
              type="submit"
              isLoading={isSubmitting}
              colorScheme="teal"
            >
              update post
            </Button>
          </Form>
        )}
      </Formik>
    </Layout>
  )
}

export default withUrqlClient(createUrqlClient)(EditPost)
