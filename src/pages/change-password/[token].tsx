import { Box, Button, Link, Flex } from '@chakra-ui/react'
import { Form, Formik } from 'formik'
import { NextPage } from 'next'
import React, { useState } from 'react'
import { InputField } from '../../components/InputField'
import { Wrapper } from '../../components/Wrapper'
import { toErrorMap } from '../../utils/toErrorMap'
import { useChangePasswordMutation } from '../../generated/graphql'
import { useRouter } from 'next/router'
import { withUrqlClient } from 'next-urql'
import { createUrqlClient } from '../../utils/createUrqlClient'
import NextLink from 'next/link'

const ChangePassword: NextPage<{}> = () => {
  const router = useRouter()
  const [, changePassword] = useChangePasswordMutation()
  const [tokenError, setTokenError] = useState('')
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ newPassword: '' }}
        onSubmit={async (values, { setErrors }) => {
          const response = await changePassword({
            token:
              typeof router.query.token === 'string' ? router.query.token : '',
            newPassword: values.newPassword,
          })

          if (response.data?.changePassword.errors) {
            const errorMap = toErrorMap(response.data.changePassword.errors)
            if ('token' in errorMap) {
              setTokenError(errorMap.token)
            }
            setErrors(errorMap)
          } else if (response.data?.changePassword.user) {
            router.push('/')
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="newPassword"
              placeholder="new password"
              label="New Password"
              type="password"
            />
            {tokenError ? (
              <Flex>
                <Box mr={2} style={{ color: 'red' }}>
                  {tokenError}
                </Box>

                <NextLink href="/forgot-password">
                  <Link>click here to get new one.</Link>
                </NextLink>
              </Flex>
            ) : null}
            <Button
              mt={4}
              type="submit"
              isLoading={isSubmitting}
              colorScheme="teal"
            >
              change password
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  )
}

export default withUrqlClient(createUrqlClient)(ChangePassword as any)
