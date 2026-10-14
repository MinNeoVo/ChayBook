import { apiFetch } from "./api";

/**
 * Lấy danh sách bình luận gốc của bài viết (phân trang)
 * GET /api/posts/{postId}/comments?page={page}&size={size}
 * @param {number} postId
 * @param {number} page
 * @param {number} size
 * @param {object} options
 */
export async function getPostComments(postId, page = 0, size = 10, { signal } = {}) {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  return apiFetch(`/posts/${postId}/comments?${query.toString()}`, {
    method: "GET",
    signal,
  });
}

/**
 * Lấy danh sách phản hồi của một bình luận gốc (phân trang)
 * GET /api/posts/{postId}/comments/{rootId}/replies?page={page}&size={size}
 * @param {number} postId
 * @param {number} rootId
 * @param {number} page
 * @param {number} size
 * @param {object} options
 */
export async function getCommentReplies(
  postId,
  rootId,
  page = 0,
  size = 5,
  { signal } = {},
) {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  return apiFetch(
    `/posts/${postId}/comments/${rootId}/replies?${query.toString()}`,
    {
      method: "GET",
      signal,
    },
  );
}

/**
 * Tạo bình luận mới hoặc gửi câu trả lời
 * POST /api/posts/{postId}/comments
 * @param {number} postId
 * @param {{ content: string, replyToCommentId?: number|null }} payload
 */
export async function createComment(postId, { content, replyToCommentId = null }) {
  const body = {
    content: content.trim(),
  };

  if (replyToCommentId) {
    body.replyToCommentId = Number(replyToCommentId);
  }

  return apiFetch(`/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Cập nhật nội dung bình luận
 * PATCH /api/posts/{postId}/comments/{commentId}
 * @param {number} postId
 * @param {number} commentId
 * @param {string} content
 */
export async function updateComment(postId, commentId, content) {
  return apiFetch(`/posts/${postId}/comments/${commentId}`, {
    method: "PATCH",
    body: JSON.stringify({
      content: content.trim(),
    }),
  });
}

/**
 * Xóa bình luận (soft delete)
 * DELETE /api/posts/{postId}/comments/{commentId}
 * @param {number} postId
 * @param {number} commentId
 */
export async function deleteComment(postId, commentId) {
  return apiFetch(`/posts/${postId}/comments/${commentId}`, {
    method: "DELETE",
  });
}
