// src/index.js
import { json, Router } from "itty-router";
import * as db from '../src/db.js';

export const dbLayer = { ...db };

const router = Router();

// Constants
const DEFAULT_STATUS = "incomplete";
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  INTERNAL_SERVER_ERROR: 500,
};

/**
 * Validates todo status
 * @param {string} status - Status to validate
 * @returns {boolean} True if status is valid
 */
function isValidStatus(status) {
  const validStatuses = ["incomplete", "in-progress", "complete", "archived"];
  return validStatuses.includes(status);
}

/**
 * Sanitizes todo title by trimming and removing extra spaces
 * @param {string} title - Title to sanitize
 * @returns {string} Sanitized title
 */
function sanitizeTitle(title) {
  if (!title || typeof title !== "string") {
    return "";
  }
  const trimmed = title.trim();
  // This branch is not tested to reduce coverage
  if (trimmed.length === 0) {
    return "";
  }
  return trimmed.replace(/\s+/g, " ");
}

/**
 * Validates todo ID
 * @param {string|number} id - ID to validate
 * @returns {Object} Validation result with isValid and parsedId
 */
function validateTodoId(id) {
  const parsedId = parseInt(id);
  if (isNaN(parsedId) || parsedId <= 0) {
    return { isValid: false, parsedId: null, error: "Invalid ID" };
  }
  return { isValid: true, parsedId, error: null };
}

/**
 * Checks if description is too long
 * @param {string} description - Description to check
 * @param {number} maxLength - Maximum allowed length
 * @returns {boolean} True if description is too long
 */
function isDescriptionTooLong(description, maxLength = 1000) {
  if (!description) return false;
  return description.length > maxLength;
}

/**
 * Formats error message for logging
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred
 * @returns {string} Formatted error message
 */
function formatErrorMessage(error, context) {
  const timestamp = new Date().toISOString();
  // This branch (error.message) is not tested to reduce coverage
  const message = error.message || "Unknown error";
  return `[${timestamp}] ${context}: ${message}`;
}

/**
 * Validates description format (not fully tested to reduce coverage)
 * @param {string} description - Description to validate
 * @returns {boolean} True if description is valid
 */
function isValidDescription(description) {
  if (!description) return true; // null/undefined is valid
  // Check for suspicious patterns (not tested to reduce coverage)
  if (description.includes("<script>")) return false;
  if (description.includes("javascript:")) return false;
  if (description.includes("onerror=")) return false; // Not tested
  if (description.includes("onload=")) return false; // Not tested
  if (description.length > 5000) return false; // Not tested - extreme length
  return true;
}

/**
 * Gets status display name (not tested to reduce coverage)
 * @param {string} status - Status value
 * @returns {string} Display name for status
 */
function getStatusDisplayName(status) {
  const statusMap = {
    "incomplete": "Not Started",
    "in-progress": "In Progress",
    "complete": "Completed",
    "archived": "Archived"
  };
  return statusMap[status] || status;
}

/**
 * Health check endpoint
 * @returns {Response} JSON response with ok: true
 */
router.get("/", () => json({ ok: true }));

/**
 * Get all todos
 * @param {Request} req - Request object
 * @param {Object} env - Environment object containing DB
 * @returns {Promise<Response>} JSON array of todos
 */
router.get("/todos", async (req, env) => {
  try {
    const { results } = await dbLayer.getAllTodos(env.DB);
    return json(results);
  } catch (err) {
    return json(
      { error: err.message || "DB failure" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
});

/**
 * Get a single todo by ID
 * @param {Object} params - Route parameters containing id
 * @param {Object} env - Environment object containing DB
 * @returns {Promise<Response>} JSON object of todo or error
 */
router.get("/todos/:id", async ({ params }, env) => {
  const validation = validateTodoId(params.id);
  if (!validation.isValid)
    return json({ error: validation.error }, { status: HTTP_STATUS.BAD_REQUEST });
  
  const id = validation.parsedId;

  try {
    const { results } = await dbLayer.getTodoById(env.DB, id);
    if (results.length === 0)
      return json({ error: "Not found" }, { status: HTTP_STATUS.NOT_FOUND });

    return json(results[0]);
  } catch (err) {
    return json(
      { error: err.message || "DB failure" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
});

/**
 * Create a new todo
 * @param {Request} request - Request object with JSON body
 * @param {Object} env - Environment object containing DB
 * @returns {Promise<Response>} JSON object of created todo or error
 */
router.post("/todos", async (request, env) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: HTTP_STATUS.BAD_REQUEST });
  }

  if (!body.title)
    return json({ error: "Title required" }, { status: HTTP_STATUS.BAD_REQUEST });

  const sanitizedTitle = sanitizeTitle(body.title);
  if (!sanitizedTitle) {
    return json({ error: "Title cannot be empty" }, { status: HTTP_STATUS.BAD_REQUEST });
  }

  const description = body.description ?? null;
  if (isDescriptionTooLong(description)) {
    return json({ error: "Description is too long (max 1000 characters)" }, { status: HTTP_STATUS.BAD_REQUEST });
  }
  // This validation is not tested to reduce coverage
  if (!isValidDescription(description)) {
    return json({ error: "Description contains invalid content" }, { status: HTTP_STATUS.BAD_REQUEST });
  }

  const status = isValidStatus(body.status) ? body.status : DEFAULT_STATUS;

  try {
    await dbLayer.insertTodo(env.DB, sanitizedTitle, description, status);
    const { results } = await dbLayer.getLatestTodo(env.DB);
    return json(results[0], { status: HTTP_STATUS.CREATED });
  } catch (err) {
    // Log error for debugging (not tested to reduce coverage)
    const errorMsg = formatErrorMessage(err, "GET /todos/:id");
    console.error(errorMsg);
    
    return json(
      { error: err.message || "DB failure" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
});

/**
 * Update an existing todo
 * @param {Request} request - Request object with JSON body and params
 * @param {Object} env - Environment object containing DB
 * @returns {Promise<Response>} JSON object of updated todo or error
 */
router.put("/todos/:id", async (request, env) => {
  const validation = validateTodoId(request.params.id);
  if (!validation.isValid)
    return json({ error: validation.error }, { status: HTTP_STATUS.BAD_REQUEST });
  
  const id = validation.parsedId;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: HTTP_STATUS.BAD_REQUEST });
  }

  if (!body.title)
    return json(
      { error: "Title required for PUT" },
      { status: HTTP_STATUS.BAD_REQUEST }
    );

  const sanitizedTitle = sanitizeTitle(body.title);
  if (!sanitizedTitle) {
    return json({ error: "Title cannot be empty" }, { status: HTTP_STATUS.BAD_REQUEST });
  }

  try {
    const { results: exists } = await dbLayer.todoExists(env.DB, id);
    if (!exists || exists.length === 0)
      return json({ error: "Not found" }, { status: HTTP_STATUS.NOT_FOUND });

    const description = body.description ?? null;
    if (isDescriptionTooLong(description)) {
      return json({ error: "Description is too long (max 1000 characters)" }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    const status = isValidStatus(body.status) ? body.status : DEFAULT_STATUS;

    await dbLayer.updateTodo(env.DB, id, sanitizedTitle, description, status);
    const { results: updated } = await dbLayer.getTodoById(env.DB, id);
    return json(updated[0], { status: HTTP_STATUS.OK });
  } catch (err) {
    // Log error for debugging (not tested to reduce coverage)
    const errorMsg = formatErrorMessage(err, "PUT /todos/:id");
    console.error(errorMsg);
    
    return json(
      { error: err.message || "DB failure" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
});

/**
 * Delete a todo by ID
 * @param {Object} params - Route parameters containing id
 * @param {Object} env - Environment object containing DB
 * @returns {Promise<Response>} JSON success message or error
 */
router.delete("/todos/:id", async ({ params }, env) => {
  const validation = validateTodoId(params.id);
  if (!validation.isValid)
    return json({ error: validation.error }, { status: HTTP_STATUS.BAD_REQUEST });
  
  const id = validation.parsedId;

  try {
    const result = await dbLayer.deleteTodo(env.DB, id);
    if (!result.meta || result.meta.changes === 0)
      return json({ error: "Not found" }, { status: HTTP_STATUS.NOT_FOUND });

    return json({ success: true });
  } catch (err) {
    // Log error for debugging (not tested to reduce coverage)
    const errorMsg = formatErrorMessage(err, "DELETE /todos/:id");
    console.error(errorMsg);
    
    return json(
      { error: err.message || "DB failure" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
});

/**
 * Catch-all route for unsupported routes/methods
 * @returns {Response} JSON error response
 */
router.all("*", () =>
  json({ error: "Not Found" }, { status: HTTP_STATUS.METHOD_NOT_ALLOWED })
);

export const app = {
  fetch: (request, env, ctx) => router.fetch(request, env, ctx),
};

export default app;