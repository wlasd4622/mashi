let pu = require('./pUtils')
let axios = require('axios')
let fs = require('fs')
let moment = require('moment');
let path = require('path')
let fsUtil = require('./fsUtil')

class M extends pu {
    constructor() {
        super();
        this.taskName = 'mashi'
        this.cookie = `_139_login_version=25; UUIDToken=c563c484-0525-4522-be69-92feb7170b39; _139_index_isSmsLogin=1; a_l=1585024975000|1887718527; a_l2=1585024975000|12|MTUwMTEwOTkzMTJ8MjAyMC0wMy0yNCAxMjo0Mjo1NXxiZEpzSmp2WG1MUko1T2MzOFBVd2UvWnN4ZktZMkRpME8rTnZ6R1pDQTFzPXxlZjViMTEyYTk2NTIxYjIzMmUwOWU2MmI2MTg2OGJjNQ==; RMKEY=f7f8ce53754c8727; Os_SSo_Sid=00U2OTQ3Mjk3NTAwMTk0NDU005087B73000001; cookiepartid3124=12; cookiepartid=12; Login_UserNumber=15011099312; UserData={}; SkinPath23124=; rmUin3124=1336440719; provCode3124=6; areaCode3124=600; loginProcessFlag=`;
        this.list = [];
        this.config = {};
        this.init();
        this.sendSmsTryCount = 0;
    }

    async init() {
        let config = fs.readFileSync(path.join('/wwl_config')).toString();
        config.split(/\n/g).map(item => {
            let [key, value] = item.split('=');
            this.config[key] = value;
        });
        await fsUtil.dirExists('./temp')
        await fsUtil.dirExists('./temp/logs')
        await fsUtil.dirExists('./temp/data.json')
        this.list = JSON.parse(fs.readFileSync('./temp/data.json').toString() || '""') || []
    }

    async sendSMS(content = '666') {
        try {
            this.log(`>>>sendSMS:${this.sendSmsTryCount}`);
            this.sendSmsTryCount += 1;
            if (this.sendSmsTryCount > 5) return false;
            await this.runPuppeteer({
                headless: true
            });
            await this.sleep(1000)
            let url = `http://mail.10086.cn/`
            this.page.goto(url, {
                waitUntil: 'domcontentloaded'
            });
            await this.page.waitForSelector('#J_loginFormHeight');
            await this.page.type('#txtUser', this.config.ms_user_name)
            await this.page.type('#txtPass', this.config.ms_password)
            await this.sleep()
            await this.page.click('#loginBtn')
            await this.page.waitForSelector('#welcome');
            await this.sleep(500)
            this.pageSMS = this.page.frames().find(frame => frame.url().indexOf('m2012server/home') > -1)
            await this.pageSMS.waitForSelector('#smsSend');
            await this.pageSMS.click('#smsSend')
            await this.sleep(500)
            await this.page.reload()
            await this.page.waitForSelector('#divTab');
            await this.sleep()
            this.pageSend = this.page.frames().find(frame => frame.url().indexOf('sms/sms_send') > -1)
            // await this.pageSend.click('#txtMobiles')
            await this.sleep()
            await this.pageSend.click('.PlaceHold')
            await this.sleep(500)
            await this.pageSend.type('.addrText-input', this.config.ms_user_name, {
                delay: 200
            })
            await this.sleep()
            await this.pageSend.click('#txtContent')
            await this.sleep()
            await this.pageSend.type('#txtContent', `码市:${content}\n${moment().format('YYYY-MM-DD HH:mm:ss')}\n`, {
                delay: 20
            })
            await this.sleep(500)
            this.pageSend.click('#btnSmsSendFooter a')
            await this.sleep(2000)
            await this.closePuppeteer();
        } catch (err) {
            this.log(err);
            await this.sleep(1000 * 10)
            await this.closePuppeteer();
            await this.sendSMS(content)
        }
    }


    sleep(ms = 300) {
        return new Promise(async (resolve, reject) => {
            setTimeout(_ => {
                resolve()
            }, ms)
        })
    }

    async getData() {
        this.log(`>>>getData`)
        return new Promise(async (resolve, reject) => {
            let url = 'https://codemart.com/api/project?page=1&roleTypeId='
            let cookie = `_ga=GA1.2.1458977849.1562917775; mid=812deff9-e926-428c-b1d7-24c15465dc30; exp=89cd78c2; withGlobalSupport=true; user-vip=true; _gid=GA1.2.1817827069.1569467425; _gat=1`
            axios.get(url, {
                header: {
                    cookie,
                },
                data: {
                    page: 1,
                }
            }).then(res => {
                let rewards = res.data.rewards;
                if (rewards && rewards.length) {
                    let ownerIdArr = res.data.rewards.map(item => item.ownerId).splice(0, 5);
                    //查询接口里有的数据，list没有
                    let newIds = [];
                    ownerIdArr.map(id => {
                        if (!this.list.includes(id)) {
                            newIds.push(id)
                        }
                    })
                    if (newIds.length) {
                        this.list = [...this.list, ...newIds]
                        fs.writeFileSync('./temp/data.json', JSON.stringify(this.list))
                    }
                    resolve(newIds)
                } else {
                    reject();
                }

            }).catch(err => {
                this.log(err);
                reject(err)
            })
        })

    }

    async task1() {
        do {
            this.log(`>>>do`);
            try {
                let ids = await this.getData();
                if (ids.length) {
                    this.sendSmsTryCount = 0;
                    await this.sendSMS(ids[0])
                }
            } catch (err) {
                this.log(err);
            }
            await this.sleep(4000)
        } while (true)
    }

    async main() {
        this.log(`>>>main`)
        this.task1()
    }
}

new M().main();