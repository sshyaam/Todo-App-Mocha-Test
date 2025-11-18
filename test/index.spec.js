import { expect } from "chai";
import sinon from "sinon";
import { app, dbLayer } from "../src/index.js";

describe("🧩 Cloudflare D1 ToDo API (Mocked)", () => {
  let env;

  // Prehook: Runs once before all tests in this suite
  before(async () => {
    // Initialize database schema if using a real D1 database
    // Uncomment and configure if you want to use a real database for integration tests
    // Or perform any other setup needed before tests
    console.log("🧪 Test suite starting - prehook executed");
  });

  // Posthook: Runs once after all tests in this suite
  after(async () => {
    // Cleanup if needed
    console.log("🧪 Test suite completed - posthook executed");
  });

  beforeEach(() => {
    env = {}; // still needed for app.fetch signature
    sinon.restore();
  });

  afterEach(() => sinon.restore());

  // --- ROOT ---
  it("GET / → should return ok true", async () => {
    const req = new Request("http://localhost/", { method: "GET" });
    const res = await app.fetch(req, env);
    const body = await res.json();

    expect(res.status).to.equal(200);
    expect(body.ok).to.be.true;
  });

  it("POST / → should return 405 for unsupported method", async () => {
    const req = new Request("http://localhost/", { method: "POST" });
    const res = await app.fetch(req, env);
    expect(res.status).to.equal(405);
  });

  // --- GET /todos ---
  it("GET /todos → should return a list of todos", async () => {
    sinon.stub(dbLayer, "getAllTodos").resolves({
      results: [
        { id: 1, title: "Test Todo", description: "Mocked todo", status: "incomplete" },
      ],
    });

    const req = new Request("http://localhost/todos", { method: "GET" });
    const res = await app.fetch(req, env);
    const body = await res.json();

    expect(res.status).to.equal(200);
    expect(body).to.be.an("array");
    expect(body[0].title).to.equal("Test Todo");
  });

  it("GET /todos → should handle database error", async () => {
    sinon.stub(dbLayer, "getAllTodos").rejects(new Error("DB failure"));

    const req = new Request("http://localhost/todos", { method: "GET" });
    const res = await app.fetch(req, env);
    const body = await res.json();

    expect(res.status).to.equal(500);
    expect(body.error).to.match(/DB failure/);
  });

  // --- GET /todos/:id ---
  it("GET /todos/:id → should return a single todo", async () => {
    sinon.stub(dbLayer, "getTodoById").resolves({
      results: [
        {
          id: 1,
          title: "Test Todo",
          description: "Mocked todo",
          status: "incomplete",
        },
      ],
    });

    const req = new Request("http://localhost/todos/1", { method: "GET" });
    const res = await app.fetch(req, env);
    const body = await res.json();

    expect(res.status).to.equal(200);
    expect(body.id).to.equal(1);
  });

  it("GET /todos/:id → should return 404 if not found", async () => {
    sinon.stub(dbLayer, "getTodoById").resolves({
      results: [],
    });

    const req = new Request("http://localhost/todos/99", { method: "GET" });
    const res = await app.fetch(req, env);
    const body = await res.json();

    expect(res.status).to.equal(404);
    expect(body.error).to.equal("Not found");
  });

  it("GET /todos/:id → should return 400 for invalid ID", async () => {
    const req = new Request("http://localhost/todos/abc", { method: "GET" });
    const res = await app.fetch(req, env);
    const body = await res.json();
    expect(res.status).to.equal(400);
    expect(body.error).to.equal("Invalid ID");
  });

  // --- POST /todos ---
  it("POST /todos → should create a new todo", async () => {
    sinon.stub(dbLayer, "insertTodo").resolves({ success: true });
    sinon.stub(dbLayer, "getLatestTodo").resolves({
      results: [
        {
          id: 1,
          title: "New Todo",
          description: "Write tests",
          status: "incomplete",
        },
      ],
    });

    const req = new Request("http://localhost/todos", {
      method: "POST",
      body: JSON.stringify({
        title: "New Todo",
        description: "Write tests",
        status: "incomplete",
      }),
    });

    const res = await app.fetch(req, env);
    const body = await res.json();

    expect(res.status).to.equal(201);
    expect(body.title).to.equal("New Todo");
  });

  it("POST /todos → should return 400 if no title", async () => {
    const req = new Request("http://localhost/todos", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await app.fetch(req, env);
    const body = await res.json();

    expect(res.status).to.equal(400);
    expect(body.error).to.equal("Title required");
  });

  it("POST /todos → should return 400 for malformed JSON", async () => {
    const req = new Request("http://localhost/todos", {
      method: "POST",
      body: "{bad json",
    });

    const res = await app.fetch(req, env);
    const body = await res.json();

    expect(res.status).to.equal(400);
    expect(body.error).to.match(/Invalid JSON/);
  });

  // --- PUT /todos/:id ---
  it("PUT /todos/:id → should update an existing todo", async () => {
    sinon.stub(dbLayer, "todoExists").resolves({
      results: [{ 1: 1 }], // Non-empty results means todo exists
    });
    sinon.stub(dbLayer, "updateTodo").resolves({ success: true });
    sinon.stub(dbLayer, "getTodoById").resolves({
      results: [
        {
          id: 1,
          title: "Updated Todo",
          status: "complete",
        },
      ],
    });

    const req = new Request("http://localhost/todos/1", {
      method: "PUT",
      body: JSON.stringify({ title: "Updated Todo", status: "complete" }),
    });

    const res = await app.fetch(req, env);
    const body = await res.json();

    expect(res.status).to.equal(200);
    expect(body.title).to.equal("Updated Todo");
  });

  it("PUT /todos/:id → should return 404 if not found", async () => {
    sinon.stub(dbLayer, "todoExists").resolves({
      results: [], // Empty results means todo doesn't exist
    });

    const req = new Request("http://localhost/todos/99", {
      method: "PUT",
      body: JSON.stringify({ title: "Doesn't exist" }),
    });

    const res = await app.fetch(req, env);
    const body = await res.json();

    expect(res.status).to.equal(404);
    expect(body.error).to.equal("Not found");
  });

  it("PUT /todos/:id → should return 400 for invalid JSON body", async () => {
    const req = new Request("http://localhost/todos/1", {
      method: "PUT",
      body: "{invalid",
    });

    const res = await app.fetch(req, env);
    const body = await res.json();
    expect(res.status).to.equal(400);
    expect(body.error).to.match(/Invalid JSON/);
  });

  // --- DELETE /todos/:id ---
  it("DELETE /todos/:id → should delete a todo", async () => {
    sinon.stub(dbLayer, "deleteTodo").resolves({
      meta: {
        changes: 1, // 1 change means todo was deleted
      },
    });

    const req = new Request("http://localhost/todos/1", { method: "DELETE" });
    const res = await app.fetch(req, env);
    const body = await res.json();

    expect(res.status).to.equal(200);
    expect(body.success).to.be.true;
  });

  it("DELETE /todos/:id → should return 404 if not found", async () => {
    sinon.stub(dbLayer, "deleteTodo").resolves({
      meta: {
        changes: 0, // 0 changes means todo wasn't found
      },
    });

    const req = new Request("http://localhost/todos/99", { method: "DELETE" });
    const res = await app.fetch(req, env);
    const body = await res.json();

    expect(res.status).to.equal(404);
    expect(body.error).to.equal("Not found");
  });

  it("DELETE /todos/:id → should return 400 for invalid ID", async () => {
    const req = new Request("http://localhost/todos/abc", { method: "DELETE" });
    const res = await app.fetch(req, env);
    const body = await res.json();
    expect(res.status).to.equal(400);
    expect(body.error).to.equal("Invalid ID");
  });
});
