import { api, type ApiError } from "../client";

describe("api client response parsing", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  it("resolves with the response's `data` field on success", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { token: "abc123", user: { _id: "1", name: "Test", email: "t@t.com" } },
      }),
    }) as unknown as typeof fetch;

    const session = await api.login({ email: "t@t.com", password: "x" });

    expect(session.token).toBe("abc123");
    expect(session.user._id).toBe("1");
  });

  it("rejects with an ApiError carrying the server's status and message on failure", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ success: false, message: "Invalid email or password" }),
    }) as unknown as typeof fetch;

    await expect(api.login({ email: "t@t.com", password: "wrong" })).rejects.toMatchObject({
      message: "Invalid email or password",
      status: 401,
    } satisfies Partial<ApiError>);
  });
});
