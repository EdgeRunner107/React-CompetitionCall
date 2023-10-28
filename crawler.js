const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
var db = require('../db');


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

router.get('/result2.json', async (req, res, next) => {
    console.log("다햇음"); 
    const query = req.query.search || '해커톤';
    const scrapedData = await scrape(query);

    let insertionErrors = [];

    for (let item of scrapedData) {
        const insertQuery = 'insert into CompetionDatas (title, link, date1, status1, daysLeft) VALUES (?, ?, ?, ?, ?)';

        try {
            await new Promise((resolve, reject) => {
                db.get().query(insertQuery, [item.title, item.link, item.date, item.status, item.daysLeft], (err, results) => {
                    if (err) reject(err);
                    resolve(results);
                });
            });
        } catch (error) {
            console.error("Error inserting data: ", error);
            insertionErrors.push(error);
        }
    }

    if (insertionErrors.length > 0) {
        res.status(500).send('Some entries failed to insert. Check the logs.');
    } else {
        res.status(200).send('Data successfully inserted!');
    }
});












module.exports = router;