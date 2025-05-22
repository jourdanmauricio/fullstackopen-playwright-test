const loginWith = async (page, username, password)  => {
  await page.getByRole('button', { name: 'login' }).click()

    // await page.getByRole('textbox').first().fill('mauricio')
    // await page.getByRole('textbox').last().fill('salainen')
      
    // const textboxes = await page.getByRole('textbox').all()
    // await textboxes[0].fill('mauricio')
    // await textboxes[1].fill('salainen')

  await page.getByTestId('username').fill(username)
  await page.getByTestId('password').fill(password)
  await page.getByRole('button', { name: 'login' }).click()
}

const createBlog = async (page, content) => {
  await page.getByRole('button', { name: 'create new blog' }).click()
  await page.getByTestId('title').fill(content.title)
  await page.getByTestId('author').fill(content.author)
  await page.getByTestId('url').fill(content.url)
  await page.getByRole('button', { name: 'create' }).click()
  await page.getByText(`${content.title} ${content.author}`).waitFor()
}

export { loginWith, createBlog }

