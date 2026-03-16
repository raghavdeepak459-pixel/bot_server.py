# ╔══════════════════════════════════════════════════════════════╗
# ║  TRADING BOT BACKEND — Cloud Deploy Ready                   ║
# ║  Render.com ya PythonAnywhere par host karein               ║
# ╚══════════════════════════════════════════════════════════════╝
#
# INSTALL: pip install flask flask-cors gunicorn
# LOCAL:   python bot_server.py
# CLOUD:   Neeche deploy instructions dekhein
# ══════════════════════════════════════════════════════════════

from flask import Flask, jsonify, request
from flask_cors import CORS
import threading, time, datetime, random, os

app = Flask(__name__)
CORS(app)  # Mobile App ko allow karta hai

# ─────────────────────────────────────────────
#  BOT STATE (in-memory)
# ─────────────────────────────────────────────
state = {
    "is_running":    False,
    "symbol":        "RELIANCE",
    "last_price":    2341.50,
    "price_change":  "+0.00%",
    "pnl":           0.0,
    "trade_count":   0,
    "position":      "FLAT",
}
trades = []  # Trade history list
logs   = []  # Log messages list
_bot_thread = None

# ─────────────────────────────────────────────
#  HELPER FUNCTIONS
# ─────────────────────────────────────────────
def log(msg):
    """Timestamped log add karo"""
    ts  = datetime.datetime.now().strftime("%H:%M:%S")
    entry = f"[{ts}] {msg}"
    logs.append(entry)
    print(entry)
    if len(logs) > 300:
        logs.pop(0)

def add_trade(symbol, ttype, price, pnl):
    """Ek trade record karo"""
    trades.insert(0, {
        "symbol": symbol,
        "type":   ttype,
        "price":  round(price, 2),
        "pnl":    round(pnl, 2),
        "time":   datetime.datetime.now().strftime("%H:%M"),
    })
    state["pnl"]         = round(state["pnl"] + pnl, 2)
    state["trade_count"] += 1
    if len(trades) > 100:
        trades.pop()

# ─────────────────────────────────────────────
#  BOT LOGIC — YAHAN APNA REAL LOGIC LAGAYEIN
# ─────────────────────────────────────────────
def trading_bot_loop():
    """
    Yeh demo loop hai.
    Apna actual trading logic yahan replace karein:
    - broker.place_order(...)
    - zerodha kite API
    - angel broking smart API
    - ya koi bhi broker API
    """
    log("Bot started. Market scanning shuru...")
    state["position"] = "WATCHING"

    while state["is_running"]:
        try:
            # ── Demo: price simulate karo ──
            change          = round(random.uniform(-15, 15), 2)
            new_price       = round(state["last_price"] + change, 2)
            pct             = round((change / state["last_price"]) * 100, 2)
            state["last_price"]   = new_price
            state["price_change"] = f"{'+' if pct >= 0 else ''}{pct}%"

            log(f"Price: ₹{new_price} ({state['price_change']})")

            # ── Demo: kabhi kabhi trade lagao ──
            if random.random() > 0.80:
                ttype = random.choice(["BUY", "SELL"])
                pnl   = round(random.uniform(-400, 700), 2)
                state["position"] = "LONG" if ttype == "BUY" else "SHORT"
                add_trade(state["symbol"], ttype, new_price, pnl)
                log(f"{ttype} {state['symbol']} @ ₹{new_price} | P&L: ₹{pnl}")

                if pnl > 0:
                    log(f"Target hit! +₹{pnl} profit booked.")
                    state["position"] = "FLAT"
                else:
                    log(f"Stop loss hit. ₹{abs(pnl)} loss.")
                    state["position"] = "FLAT"

            time.sleep(4)

        except Exception as e:
            log(f"ERROR: {str(e)}")
            time.sleep(5)

    state["position"] = "FLAT"
    log("Bot stopped.")

# ─────────────────────────────────────────────
#  API ENDPOINTS
# ─────────────────────────────────────────────

@app.route("/")
def home():
    """Health check — browser mein kholo aur dekhein kaam kar raha hai"""
    return jsonify({"status": "ok", "message": "Trading Bot API chal raha hai!"})

@app.route("/api/status")
def get_status():
    return jsonify(state)

@app.route("/api/toggle", methods=["POST"])
def toggle():
    global _bot_thread
    if state["is_running"]:
        state["is_running"] = False
        log("STOP command received.")
    else:
        state["is_running"] = True
        _bot_thread = threading.Thread(target=trading_bot_loop, daemon=True)
        _bot_thread.start()
        log("START command received.")
    return jsonify(state)

@app.route("/api/trades")
def get_trades():
    return jsonify({
        "trades":  trades,
        "total":   len(trades),
        "net_pnl": state["pnl"],
    })

@app.route("/api/logs")
def get_logs():
    return jsonify({
        "logs":  logs,
        "count": len(logs),
    })

# ─────────────────────────────────────────────
#  SERVER START
# ─────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    log("Server start ho raha hai...")
    app.run(host="0.0.0.0", port=port, debug=False)
