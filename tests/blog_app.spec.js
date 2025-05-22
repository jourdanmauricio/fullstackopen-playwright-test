const { test, describe, expect, beforeEach } = require('@playwright/test')
const { loginWith, createBlog } = require('./helper')

describe('Blog app', () => {

  beforeEach(async ({ page, request }) => {

    await request.post('/api/testing/reset')

    await request.post('/api/users', {
      data: {
        name: 'Mauricio Jourdan',
        username: 'mauricio',
        password: 'mauri2025'
      }
    })

    await request.post('/api/users', {
      data: {
        name: 'Paola Jourdan',
        username: 'paola',
        password: 'paola2025'
      }
    })

    await page.goto('/')
  })

  test('Login form is shown', async ({ page }) => {
    const locator = await page.getByText('Log in to application')

    // await page.screenshot({ path: 'screenshot.png' });
    // console.log(await page.content());
    await expect(locator).toBeVisible()
    
  })

  describe('Login', () => {
    test('succeeds with correct credentials', async ({ page }) => {
      await page.getByRole('button', { name: 'login' }).click()
    
      await loginWith(page, 'mauricio', 'mauri2025')
      await expect(page.getByText('Mauricio Jourdan logged in')).toBeVisible()
    })

    test('fails with wrong credentials', async ({ page }) => {
      await loginWith(page, 'mauricio', 'wrong')
      await expect(page.getByText('wrong credentials')).toBeVisible()
    })
  })

  describe.serial('when logged in', () => {
    beforeEach(async ({ page }) => {
      await loginWith(page, 'mauricio', 'mauri2025')
    })

    test('a new blog can be created', async ({ page }) => {
      await createBlog(page, {title: 'Foro bursatil', author: 'Juan Rava', url: 'https://foro.rava.com/foro3/viewforum.php'})
      await expect(page.getByText('Foro bursatil Juan Rava')).toBeVisible()
    })

    describe.serial('and a blog exists', () => {
      beforeEach(async ({ page }) => {
        await createBlog(page, {title: 'First blog', author: 'Juan Rava', url: 'https://firstblog.com.ar'})
        await createBlog(page, {title: 'Foro bursatil', author: 'Juan Rava', url: 'https://foro.rava.com/foro3/viewforum.php'})
        await createBlog(page, {title: 'Third blog', author: 'Juan Rava', url: 'https://thirdblog.com.ar'})
      })

      test('a blog can be updated', async ({ page }) => {
        const blogText = await page.getByText('Foro bursatil Juan Rava')
        const blogTextElement = await blogText.locator('..')   // padre
        await blogTextElement.getByRole('button', { name: 'view' }).click()
        await blogTextElement.getByRole('button', { name: 'like' }).click()
        await expect(blogTextElement.getByText('likes 1')).toBeVisible()
      })

      test('a blog can be deleted', async ({ page }) => {
        // await page.waitForSelector('.blog >> text="Foro bursatil Juan Rava"');

        page.on('dialog', async dialog => {
          expect(dialog.type()).toBe('confirm');
          await dialog.accept(); // Acepta el diálogo de confirmación
        });

        const blogText = await page.getByText('Foro bursatil Juan Rava')
        // await blogText.waitFor();
        const blogElement = await blogText.locator('..')   // padre
        await blogElement.getByRole('button', { name: 'view' }).click()
        
        await blogElement.getByRole('button', { name: 'remove' }).click()

        await expect(blogElement).not.toBeVisible();
        await expect(page.getByText('Foro bursatil Juan Rava')).not.toBeVisible();
      })  

      test('Only the creator can see the delete button of a blog', async({page}) => {
        await page.getByRole('button', { name: 'logout' }).click()

        await loginWith(page, 'paola', 'paola2025')
        await expect(page.getByText('Paola Jourdan logged in')).toBeVisible()

        const blogText = await page.getByText('Foro bursatil Juan Rava')
        const blogElement = await blogText.locator('..') 

        await blogElement.getByRole('button', { name: 'view' }).click()
        await expect(blogElement.getByRole('button', { name: 'remove' })).not.toBeVisible()
      })

      test('Check that the blogs are sorted according to likes', async({page}) => {

        let blogElements = await page.locator('.blog').all();
  
        for (const blog of blogElements) {
          await blog.getByRole('button', { name: 'view' }).click();
        }
      
        // 9 Likes aleatorios
        const likeInteractions = 9;
        
        for (let i = 0; i < likeInteractions; i++) {
          const randomIndex = Math.floor(Math.random() * blogElements.length);
          const randomBlog = blogElements[randomIndex];
          
          await randomBlog.getByRole('button', { name: 'like' }).click();
          // await page.pause()

          blogElements = await page.locator('.blog').all();
        }

        const finalBlogs = await page.locator('.blog').all();
        const blogLikes = [];
        
        for (const blog of finalBlogs) {
          const likesElement = await blog.getByText('likes', { exact: false });
          const likesText = await likesElement.innerText();
          const likes = parseInt(likesText.split(' ')[1]);
          blogLikes.push(likes);
        }
      
        for (let i = 0; i < blogLikes.length - 1; i++) {
          expect(blogLikes[i]).toBeGreaterThanOrEqual(blogLikes[i + 1]);
        }
      });
        
    })
  })
})