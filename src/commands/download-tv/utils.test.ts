import { describe, expect, it } from "bun:test";
import { findDownloadedFile, is10PlayUrl, isSbsUrl, parseEpisodeNumberFromUrl } from "./utils.js";

describe("parseEpisodeNumberFromUrl", () => {
    it("tenplay urls", () => {
        const cases: { url: string; episode: string }[] = [
            {
                url: "https://10play.com.au/the-cheap-seats/episodes/season-4/episode-25/tpv241015mrlsi",
                episode: "25",
            },
            {
                url: "https://10play.com.au/have-you-been-paying-attention/episodes/2024/episode-21/tpv240930bpnte",
                episode: "21",
            },
            {
                url: "https://10.com.au/the-cheap-seats/episodes/season-5/the-cheap-seats-s5-ep-30/tpv251118gxpqt",
                episode: "30",
            },
        ];
        for (const { url, episode } of cases) {
            expect(parseEpisodeNumberFromUrl(url)).toBe(episode);
        }
    });

    it("9now urls", () => {
        const cases: { url: string; episode: string }[] = [
            {
                url: "https://www.9now.com.au/travel-guides/season-7/episode-4",
                episode: "4",
            },
        ];
        for (const { url, episode } of cases) {
            expect(parseEpisodeNumberFromUrl(url)).toBe(episode);
        }
    });
});

describe(is10PlayUrl, () => {
    it.each([
        "https://10play.com.au/the-cheap-seats/episodes/season-4/episode-25/tpv241015mrlsi",
        "https://10play.com.au/have-you-been-paying-attention/episodes/2024/episode-21/tpv240930bpnte",
        "https://10.com.au/the-cheap-seats/episodes/season-5/the-cheap-seats-s5-ep-30/tpv251118gxpqt",
    ])("identifies valid: %s", (url: string) => {
        expect(is10PlayUrl(url)).toBe(true);
    });

    it.each([
        "https://www.9now.com.au/travel-guides/season-7/episode-4",
        "https://www.bbc.com/iplayer/episode/m001q8x4/some-show-series-1-episode-2",
        "https://www.netflix.com/watch/12345678",
    ])("identifies invalid: %s", (url: string) => {
        expect(is10PlayUrl(url)).toBe(false);
    });
});

describe(isSbsUrl, () => {
    it.each([
        "https://www.sbs.com.au/ondemand/watch/2514082371964",
        "https://sbs.com.au/ondemand/watch/2514082371964",
    ])("identifies valid: %s", (url: string) => {
        expect(isSbsUrl(url)).toBe(true);
    });

    it.each([
        "https://10play.com.au/the-cheap-seats/episodes/season-4/episode-25/tpv241015mrlsi",
        "https://notsbs.com.au/ondemand/watch/1",
        "not a url",
    ])("identifies invalid: %s", (url: string) => {
        expect(isSbsUrl(url)).toBe(false);
    });
});

describe(findDownloadedFile, () => {
    const base = "Show - S01E01 - Episode 1";

    it("finds the final file regardless of extension", () => {
        expect(findDownloadedFile([`${base}.mkv`], base)).toBe(`${base}.mkv`);
        expect(findDownloadedFile([`${base}.mp4`], base)).toBe(`${base}.mp4`);
    });

    it("ignores partial and intermediate files", () => {
        const files = [`${base}.mp4.part`, `${base}.f3051.mp4`, `${base}.f3051.mp4.ytdl`];
        expect(findDownloadedFile(files, base)).toBeUndefined();
        expect(findDownloadedFile([...files, `${base}.mp4`], base)).toBe(`${base}.mp4`);
    });

    it("ignores other episodes", () => {
        expect(findDownloadedFile(["Show - S01E01 - Episode 10.mp4"], base)).toBeUndefined();
    });
});
