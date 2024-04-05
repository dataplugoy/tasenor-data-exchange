import { beforeAll, expect, test } from 'vitest'
import { UserModel } from '../../backend/src/models/UserModel'
import { beforeModelTesting } from '../lib/unit-testing'

beforeAll(async () => beforeModelTesting())

test('adds 1 + 2 to equal 3', async () => {

  const user = await UserModel.find('tommi.ronkainen@gmail.com')
  console.log(user)
})