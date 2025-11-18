// src/db.js
export async function getAllTodos(DB) {
  return await DB.prepare("SELECT * FROM todos").all();
}

export async function getTodoById(DB, id) {
  return await DB.prepare("SELECT * FROM todos WHERE id = ?").bind(id).all();
}

export async function insertTodo(DB, title, description, status) {
  return await DB.prepare(
    "INSERT INTO todos (title, description, status) VALUES (?, ?, ?)"
  ).bind(title, description, status).run();
}

export async function getLatestTodo(DB) {
  return await DB.prepare("SELECT * FROM todos ORDER BY id DESC LIMIT 1").all();
}

export async function todoExists(DB, id) {
  return await DB.prepare("SELECT 1 FROM todos WHERE id = ?").bind(id).all();
}

export async function updateTodo(DB, id, title, description, status) {
  return await DB.prepare(
    "UPDATE todos SET title = ?, description = ?, status = ? WHERE id = ?"
  ).bind(title, description, status, id).run();
}

export async function deleteTodo(DB, id) {
  return await DB.prepare("DELETE FROM todos WHERE id = ?").bind(id).run();
}
