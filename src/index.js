// src/index.js
import { json, Router } from "itty-router";
import * as db from '../src/db.js';

export const dbLayer = { ...db };

const router = Router();

router.get("/", () => json({ ok: true }));

// --- GET /todos ---
router.get("/todos", async (req, env) => {
  try {
    const { results } = await dbLayer.getAllTodos(env.DB);
    return json(results);
  } catch (err) {
    return json({ error: err.message || "DB failure" }, { status: 500 });
  }
});

// --- GET /todos/:id ---
router.get("/todos/:id", async ({ params }, env) => {
  const id = parseInt(params.id);
  if (isNaN(id))
    return json({ error: "Invalid ID" }, { status: 400 });

  const { results } = await dbLayer.getTodoById(env.DB, id);
  if (results.length === 0)
    return json({ error: "Not found" }, { status: 404 });

  return json(results[0]);
});

// --- POST /todos ---
router.post("/todos", async (request, env) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.title) return json({ error: "Title required" }, { status: 400 });

  const description = body.description ?? null;
  const status = body.status ?? "incomplete";

  await dbLayer.insertTodo(env.DB, body.title, description, status);
  const { results } = await dbLayer.getLatestTodo(env.DB);
  return json(results[0], { status: 201 });
});

// --- PUT /todos/:id ---
router.put("/todos/:id", async (request, env) => {
  const id = parseInt(request.params.id);
  if (isNaN(id) || id <= 0)
    return json({ error: "Invalid id" }, { status: 400 });

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.title)
    return json({ error: "Title required for PUT" }, { status: 400 });

  const { results: exists } = await dbLayer.todoExists(env.DB, id);
  if (!exists || exists.length === 0)
    return json({ error: "Not found" }, { status: 404 });

  const description = body.description ?? null;
  const status = body.status ?? "incomplete";

  await dbLayer.updateTodo(env.DB, id, body.title, description, status);
  const { results: updated } = await dbLayer.getTodoById(env.DB, id);
  return json(updated[0], { status: 200 });
});

// --- DELETE /todos/:id ---
router.delete("/todos/:id", async ({ params }, env) => {
  const id = parseInt(params.id);
  if (isNaN(id))
    return json({ error: "Invalid ID" }, { status: 400 });

  const result = await dbLayer.deleteTodo(env.DB, id);
  if (!result.meta || result.meta.changes === 0)
    return json({ error: "Not found" }, { status: 404 });

  return json({ success: true });
});

// --- Catch all ---
router.all("*", () => json({ error: "Not Found" }, { status: 405 }));

export const app = {
  fetch: (request, env, ctx) => router.fetch(request, env, ctx),
};

export default app;