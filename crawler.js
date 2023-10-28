const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
var db = require('../db');
const bodyParser = require('body-parser');



async function scrape(query) {
    let browser;
    const results = [];
    try {
        browser = await puppeteer.launch({
            headless: true,
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        });

        const page = await browser.newPage();
        await page.goto('https://thinkyou.co.kr/contest/');

        // 검색어 입력
        await page.type('input[name="searchstr"]', query);

        // 검색 버튼 클릭
        await page.click('#searchStrBtn');

        // 5초 동안 기다리기
        await page.waitForTimeout(5000);

        // 검색 결과 로딩 대기
        await page.waitForSelector('.title');

        const content = await page.content();
        const $ = cheerio.load(content);

        // 검색 결과 항목 추출
        $('.title').each((index, element) => {
            const titleText = $(element).find('h3').text().trim();
            const hrefElement = $(element).find('a').attr('href');

            const dateRange = $(element).siblings('.etc').text().trim();
            const status = $(element).siblings('.statNew').find('p.icon').text().trim();
            const daysLeft = $(element).siblings('.statNew').text().replace(status, '').trim();

            if (titleText !== "" && hrefElement) {
                const href = hrefElement.trim();
                results.push({
                    index: index + 1,
                    title: titleText,
                    link: `https://thinkyou.co.kr${href}`,
                    date: dateRange,
                    status: status,
                    daysLeft: daysLeft,
                  
                });  
            }
        });
    } catch (error) {
        console.error('Scraping failed:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }

    return results;
}





router.get('/list.json', async(req, res) => {
    const query = req.query.search || '해커톤';
    const scrapedData = await scrape(query);

    // SELECT 문을 사용하여 competionDatas 테이블의 모든 데이터를 조회합니다.
    const sql = 'SELECT * FROM competionDatas';

    db.get().query(sql, async function(err, rows) {
        if (err) {
            console.error('데이터 조회 오류:', err);
            res.status(500).send('서버 오류');
        } else {
            for (let item of scrapedData) {
                const title = item.title;

                // 데이터베이스에서 해당 title이 이미 존재하는지 확인합니다.
                const exists = rows.some(row => row.title === title);
                console.log("중복체크성공?")
                if (!exists) {
                    const link = item.link;
                    const date1 = item.date;
                    const status1 = item.status;
                    const daysLeft = item.daysLeft;

                    const sql2 = 'INSERT INTO competionDatas (title, link, date1, status1, daysLeft) VALUES (?, ?, ?, ?, ?)';    
                    db.get().query(sql2, [title, link, date1, status1, daysLeft], function(err, insertResult) {
                        if (err) {
                            console.error('데이터 삽입 오류:', err);
                            // 삽입 오류시 추가적인 처리가 필요하면 여기에 추가합니다.
                        } else {
                            // 삽입에 성공했을 때의 추가적인 처리가 필요하면 여기에 추가합니다.
                            console.log("삽입성공?")
                        }
                    });
                }
            }
            
            // 최종적으로 응답을 전송합니다.
            res.send({ list: rows });
        }
    });
});
