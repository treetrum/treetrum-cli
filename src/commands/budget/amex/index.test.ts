import { describe, expect, it } from "bun:test";
import { AmexConnector } from "./index.js";

describe("AmexConnector", () => {
    it("creates a stable UUID from the transaction reference", () => {
        const connector = new AmexConnector();
        const transactions = connector.transformStatementData(
            "Date,Description,Amount,Reference\n29/07/2026,Example,14.71,'AT262110004000010158092"
        );

        expect(transactions[0]?.id).toBe("2b417a52-267e-545b-a824-3a8468424a1b");
    });
});
