const form = document.getElementById("mail-form");
const statusEl = document.getElementById("status");
const submitBtn = document.getElementById("submit-btn");

function setStatus(msg, kind) {
  statusEl.textContent = msg;
  statusEl.className = "status" + (kind ? " " + kind : "");
}

// On load, ask the server whether a password is required, and reveal the
// password field if so.
(async () => {
  try {
    const res = await fetch("/api/config");
    const data = await res.json();
    if (data.passwordRequired) {
      const row = document.getElementById("password-row");
      const input = document.getElementById("password");
      if (row) row.hidden = false;
      if (input) input.required = true;
    }
  } catch {
    // If config can't be fetched, leave the field hidden; the send call
    // will surface a clear error if a password turns out to be required.
  }
})();

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const mode = form.querySelector('input[name="mode"]:checked').value;
  const bodyText = document.getElementById("body").value;

  const payload = {
    from: document.getElementById("from").value,
    to: document.getElementById("to").value,
    cc: document.getElementById("cc").value,
    bcc: document.getElementById("bcc").value,
    reply_to: document.getElementById("reply_to").value,
    subject: document.getElementById("subject").value,
  };
  if (mode === "html") payload.html = bodyText;
  else payload.text = bodyText;

  const pw = document.getElementById("password");
  if (pw && pw.value) payload.password = pw.value;

  submitBtn.disabled = true;
  setStatus("发送中…", "");

  try {
    const res = await fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      setStatus("发送成功！" + (data.id ? " 邮件 ID: " + data.id : ""), "ok");
      form.reset();
    } else {
      setStatus("发送失败：" + (data.error || res.status), "err");
    }
  } catch (err) {
    setStatus("网络错误：" + err.message, "err");
  } finally {
    submitBtn.disabled = false;
  }
});
