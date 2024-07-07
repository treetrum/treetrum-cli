import pixelmatch from "pixelmatch";
import { Page } from "playwright";
import { PNG } from "pngjs";

export async function login(page: Page, clientNumber: string, accessCode: string): Promise<string> {
    await page.goto("https://www.ing.com.au/securebanking/");
    await page.waitForSelector("#loginInput");

    await new Promise((res) => setTimeout(res, 500));

    await page.type("#cifField", clientNumber);

    const randomisedKeys = (await page.evaluate(`(() => {
        return Array.from(document.querySelectorAll(".pin > img")).map((img) => img.src.slice(22));
    })()`)) as string[];
    const keyMap = generateKeyMap(randomisedKeys);

    for (const char of accessCode.split("")) {
        const index = keyMap.indexOf(char);
        if (index === -1) {
            throw new Error(`Could not identify character '${char}'`);
        }
        await page.click(".uia-pin-" + index);
        await new Promise((res) => setTimeout(res, 100));
    }

    await page.click("#login-btn");

    const authToken = await page
        .waitForResponse("https://www.ing.com.au/api/token/login/issue")
        .then((res) => res.json() as Promise<TokenResponse>)
        .then((data) => data.Token);

    return authToken;
}

interface TokenResponse {
    Token: string;
}

function generateKeyMap(randomisedKeys: string[]) {
    const keypadImages = getKeypadImages();
    return randomisedKeys.map((base64str, i) => {
        const img = PNG.sync.read(Buffer.from(base64str, "base64"));
        for (let j = 0; j < keypadImages.length; j++) {
            if (pixelmatch(img.data, keypadImages[j].data, null, 180, 110) < 10) {
                return String(j);
            }
        }
        throw new Error("Could not identify keypad image (index: " + i + ")");
    });
}

function getKeypadImages() {
    return [
        "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",
    ].map((base64) => PNG.sync.read(Buffer.from(base64, "base64")));
}