import { describe, expect, it } from "bun:test";
import { parseEpisodeNumberFromUrl } from "./utils.js";

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
        ];
        cases.forEach(({ url, episode }) => {
            expect(parseEpisodeNumberFromUrl(url)).toBe(episode);
        });
    });

    it("9now urls", () => {
        const cases: { url: string; episode: string }[] = [
            {
                url: "https://www.9now.com.au/travel-guides/season-7/episode-4",
                episode: "4",
            },
        ];
        cases.forEach(({ url, episode }) => {
            expect(parseEpisodeNumberFromUrl(url)).toBe(episode);
        });
    });
});
