let puppeteer = require('puppeteer');
let fs = require('fs')
let moment = require('moment');



class PU {
  constructor() {
    
  }

  log(T) {
    let info = ''
    try {
      if (T instanceof Error) {
        console.error(T)
        info = T.message
        if (info != '修改保存异常') {
          debugger;
        }
      } else {
        info = JSON.stringify(T).replace(/^\"+/, '').replace(/\"+$/, '')
      }
      try {
        info = info.replace(/\\n/g, '').replace(/\s+/g, ' ')
      } catch (err) {
        console.log(err);
      }
      info = moment().format('YYYY-MM-DD HH:mm:ss') + ' ' + info
      console.log(info);
      if (this.taskName) {
        if (!fs.existsSync(`./temp/logs/${this.taskName}/`)) {
          fs.mkdirSync(`./temp/logs/${this.taskName}/`)
        }
        fs.appendFileSync(`./temp/logs/${this.taskName}/${moment().format('YYYY-MM-DD')}.log`, info +
          '\n')
      } else {
        fs.appendFileSync(`./logs/${moment().format('YYYY-MM-DD')}.log`, info + '\n')
      }
    } catch (error) {
      console.error(error);
    }
  }

  sleep(ms = 300) {
    this.log(`>>>sleep:${ms}`)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve()
      }, ms);
    })
  }


  async runPuppeteer(options = {}) {
    this.log(`>>>runPuppeteer`);
    this.browser = await puppeteer.launch(Object.assign({}, {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ]
    }, options));
    this.page = await this.browser.newPage();
    await this.page.setViewport({
      width: 1200,
      height: 800
    })
    return {
      browser: this.browser,
      page: this.page
    }
  }

  async goto(url, selector, page = this.page) {
    await page.goto(url, {
      waitUntil: 'domcontentloaded'
    })
    if (selector) {
      await waitForSelector(selector)
    }
  }

  async closePuppeteer() {
    this.log('>>>closePuppeteer');
    try {
      if (this.browser) {
        await this.browser.close()
      }
    } catch (error) {
      this.log(error)
    }
  }

  async loadJquery(page = this.page) {
    try {
      await page.evaluate(() => {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = '//cdn.bootcss.com/jquery/2.1.2/jquery.min.js';
        document.getElementsByTagName('head')[0].appendChild(script);
      })
      await this.sleep(1000)
    } catch (err) {
      this.log(err)
    }
  }

  /**
   * 查找等待元素出现
   * @param {*} selector
   * @param {*} page
   */
  async waitElement(selector, page = this.page) {
    let len = 0;
    try {
      this.log('>>>waitElement');
      this.log(selector)
      let jqueryExist = false;
      let doCount = 0
      do {
        doCount++;
        this.log(`do:jqueryExist:${jqueryExist}`)
        await this.sleep()
        jqueryExist = await page.evaluate(() => {
          return typeof window.jQuery === 'function'
        })
        if (doCount > 20) {
          doCount = 0;
          await this.loadJquery(page);
        }
      } while (!jqueryExist)

      for (let index = 0; index < 10; index++) {
        this.log(`waitElement第${index}次寻找...`)
        await this.sleep(500)
        len = await page.evaluate(selector => {
          return jQuery(selector).length;
        }, selector);
        this.log(`寻找结果${len}`)
        if (len) {
          break;
        }
      }
    } catch (error) {
      this.log(error)
    }
    return len;
  }



  /**
   * 等待jquery
   */
  async waitJquery(page = this.page) {
    this.log(`>>>waitJquery`)
    let jqueryExist = false;
    let doCount = 0;
    do {
      doCount++;
      this.log(`do:jqueryExist:${jqueryExist}`)
      await sleep()
      jqueryExist = await page.evaluate(() => {
        return typeof window.jQuery === 'function'
      })

      if (doCount > 20) {
        doCount = 0;
        await this.loadJquery(page);
      }
    } while (!jqueryExist)
  }



  unique(arr) {
    return Array.from(new Set(arr))
  }




  async setCookie(cookies_str = "", domain, page = this.page) {
    this.log(`>>>setCookie`);
    let cookies = cookies_str.split(';').map(pair => {
      let name = pair.trim().slice(0, pair.trim().indexOf('='))
      let value = pair.trim().slice(pair.trim().indexOf('=') + 1)
      return {
        name,
        value,
        domain
      }
    });
    return Promise.all(cookies.map(pair => {
      return page.setCookie(pair)
    }));
  }

  async setPageCookie(session, page = this.page) {
    await this.setCookie(session, '.58ganji.com', page);
    await this.setCookie(session, '.58.com', page);
    await this.setCookie(session, '.vip.58.com', page);
    await this.setCookie(session, '.anjuke.com', page);
    await this.setCookie(session, '.vip.58ganji.com', page);
  }

}
module.exports = PU;