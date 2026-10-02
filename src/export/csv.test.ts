import { describe, expect, it } from "vitest";

import { encodeCsv } from "@/src/export/csv";

describe("research CSV encoding", () => {
  it("uses UTF-8 BOM, CRLF, correct quoting, and formula protection", () => {
    const output = encodeCsv([
      ["Arabic", "Quoted", "Formula", "Multiline"],
      ["العربية", 'value, with "quotes"', "=2+2", "line 1\nline 2"],
    ]);
    expect(output.startsWith("\uFEFF")).toBe(true);
    expect(output).toContain('"value, with ""quotes"""');
    expect(output).toContain("'=2+2");
    expect(output).toContain('"line 1\nline 2"');
    expect(output.endsWith("\r\n")).toBe(true);
  });
});
