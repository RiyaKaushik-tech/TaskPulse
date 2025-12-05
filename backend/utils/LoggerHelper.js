import Event from "../models/Event.js";

export async function createEvent({ type, actor = null, targets = [], task = null, meta = {}, io = null }) {
  try {
    const t = Array.isArray(targets) ? targets.map(String) : [];
    const ev = await Event.create({ type, actor, targets: t, task, meta });
    if (io && t.length) {
      const payload = {
        id: ev._id,
        type: ev.type,
        actor,
        task,
        meta,
        createdAt: ev.createdAt,
      };
      t.forEach((userId) => {
        try {
          io.to(`user:${String(userId)}`).emit("notification:new", payload);
        } catch (e) {
          console.warn("emit error:", e);
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