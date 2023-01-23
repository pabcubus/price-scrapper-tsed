import puppeteer from "puppeteer";

const delay = async (time) => {
  return new Promise(function(resolve) { 
    setTimeout(resolve, time)
  });
}

const handleResponse = (status, data) => {
  if (status !== 'OK') {
    return {
      status,
      data: data.stack
    };
  }

  data = data
    .map(i => ({
      ...i,
      prices: handlePrice(i.prices)
    }));

  data.sort((a, b) => {
      if (a.name?.toLowerCase() > b.name?.toLowerCase()) return 1
      if (a.name?.toLowerCase() < b.name?.toLowerCase()) return -1
      return 0
    })

  return {
    status, data
  }
}

const handlePrice = (priceString) => {
  try {
    const parsedStringArray = priceString.match(/\$\s?\d{1,3}(\.\d{1,3})+/g)
    const numberedStringArray = 
      parsedStringArray
        .reduce((acc, next) => {
          if (typeof next !== 'string') return [...acc]

          const replaced = next?.toString().replace(/(\.|\$|(,\d+$))/g, '')
          return [...acc, parseInt(replaced.trim())]
        }, [])
        .sort((a, b) => {
          return a - b;
        })

    return numberedStringArray
  } catch (err) {
    return []
  }
}

export const generateOperationFunction = (queryString, client) => {
  return new Promise(async (res, rej) => { 
    try {
      const selector = client.selectors
      const url = client.url
      const d = 3000
      
      const browser = await puppeteer.launch();
      
      const promises = Array(2).fill(0).map(async (_, n) => {
        const urlEncoded = encodeURI(url?.replace(/<query>/ig, queryString).replace(/<page>/ig, (n + 1)))
        const page = await browser.newPage();
        await page.setViewport({ width: 1700, height: 1300 })
        await page.goto(urlEncoded)

        await delay(d)

        const res = await page.evaluate((selector) => {
          const items = Array.from(document.querySelectorAll(selector[0]))
          const results = items.map(i => {
            return {
              image: i.querySelector(selector[1])?.src || i.querySelector(selector[1])?.dataset?.src,
              name: i.querySelector(selector[2])?.textContent,
              prices: i.querySelector(selector[3])?.textContent
            }
          })

          return results
        }, selector);

        return Promise.resolve(res);
      });      

      const productsResponse: any[] = await Promise.all(promises);
      
      const data = productsResponse.flat();

      console.log('JSON: ', JSON.stringify(data));

      await browser.close();

      res(handleResponse('OK', data))
    } catch (error) {
      console.log(error)
      rej(handleResponse('ERR', error))
    }
  })
}

export const URLs: {client: string, url: string, selectors: any[]}[] = [
  /*
  new Client(
    'exito',
    'https://www.exito.com/<query>?_q=<query>&map=ft',
    [
      '#gallery-layout-container > div > section > a > article > div:nth-child(2)',
      '.vtex-product-summary-2-x-imageContainer > img',
      '.vtex-store-components-3-x-productBrand',
      '.exito-vtex-components-4-x-selling-price'
    ],
    generateOperationFunction()
  ),
  new Client(
    'olimpica',
    'https://www.olimpica.com/<query>?_q=<query>&map=ft',
    [
      '#gallery-layout-container > div > section > a > article',
      '.vtex-product-summary-2-x-imageContainer > img',
      '.vtex-product-summary-2-x-nameContainer',
      '.vtex-flex-layout-0-x-flexColChild:nth-child(2)'
    ],
    generateOperationFunction()
  ),*//*
  {
    client: 'alkosto',
    url: 'https://www.alkosto.com/search/?text=<query>&page=<page>&pageSize=25&sort=relevance',
    selectors: [
      '.product__item',
      '.product__item__information__image a img',
      '.product__item__top h3 a',
      '.product__price--discounts__price'
    ]
  }, */{
    client: 'olimpica',
    url: 'https://www.olimpica.com/<query>?_q=<query>&map=ft',
    selectors: [
      '#gallery-layout-container > div > section > a > article',
      '.vtex-product-summary-2-x-imageContainer > img',
      '.vtex-product-summary-2-x-nameContainer',
      '.olimpica-dinamic-flags-0-x-listPrices'
    ]
  }
]