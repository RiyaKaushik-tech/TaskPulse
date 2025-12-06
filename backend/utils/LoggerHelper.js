import Event from "../models/Event.js";

/**
 * Create an event and emit socket notification to targets
 * @param {string} type - event type (task_created, task_assigned, task_completed, user_mentioned, user_signup, task_overdue)
 * @param {string|null} actor - user id who triggered the event
 * @param {string[]} targets - array of user ids to notify
 * @param {string|null} task - task id if event relates to a task
 * @param {object} meta - additional metadata (e.g., comment text, mention context)
 * @param {object|null} io - socket.io instance
 */
export async function createEvent({ type, actor = null, targets = [], task = null, meta = {}, io = null }) {
  try {
    const t = Array.isArray(targets) ? targets.map(String).filter(Boolean) : [];
    
    const ev = await Event.create({ 
      type, 
      actor, 
      targets: t, 
      task, 
      meta,
      readBy: [],
      createdAt: new Date()
    });

    // emit socket notification to each target
    if (io && t.length) {
      const payload = {
        id: String(ev._id),
        type: ev.type,
        actor,
        task,
        meta,
        createdAt: ev.createdAt,
        read: false,
      };

      t.forEach((userId) => {
        try {
          io.to(`user:${String(userId)}`).emit("notification:new", payload);
        } catch (e) {
          console.warn("emit error for user", userId, e);
        }
      });
    }

    return ev;
  } catch (err) {
    console.error("createEvent error:", err);
    return null;
  }
}

export default createEvent;