const puppeteer = require('puppeteer');
const fs = require('fs');

let charactersList = [];

const scrapeData = async (url) => {
    console.log(`Scraping URL: ${url}`);
    let count = 0;
    let errors = 0;

    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();

    await page.goto(url);
    await page.setViewport({width: 1080, height: 1024});

    const autoScroll = async () => {
        let lastHeight = await page.evaluate('document.body.scrollHeight');
        while (true) {
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            await new Promise(resolve => setTimeout(resolve, 200)); 

            let newHeight = await page.evaluate('document.body.scrollHeight');
            if (newHeight === lastHeight) {
                break;
            }
            lastHeight = newHeight;
        }
    };

    await autoScroll();

    const cardElements = await page.$$('.simple-card');

    for (const card of cardElements) {
        let title = 'Unknown';
        let description = 'No description available';
        let image = 'Image not found';
        count++;

        try {
            title = await card.$eval('.cardname', el => el.textContent.trim());
        } catch (err) {
            console.log(`Title not found for card ${count}`);
        }

        try {
            description = await card.$eval('.card-description', el => el.textContent.trim());
        } catch (err) {
            console.log(`Description not found for card ${count}`);
        }

        try {
            image = await card.$eval('.flip0', el => el.src);
            const placeholderImage = "https://marvelsnapzone.com/wp-content/themes/blocksy-child/assets/media/blank.card.png?v1";
            if (image === placeholderImage || !image) {
                console.log(`Skipping placeholder image for ${title}`);
                continue; // Salta a la siguiente iteración si la imagen es un placeholder
            }
        } catch (err) {
            console.log(`Image not found for card ${count}`);
        }

        charactersList.push({
            title,
            description,
            image
        });
    }

    saveData(charactersList);

    await browser.close();
};

const saveData = (data) => {
    fs.writeFile('characters.json', JSON.stringify(data, null, 2), err => {
        if (err) {
            console.error('Error writing file', err);
        } else {
            console.log('Data successfully written to file');
        }
    });
};

scrapeData('https://marvelsnapzone.com/cards/');
