# main.py
import time
from app.graph import build_graph
from app.state import BrainState

def main():
    print("🧠 Master Brain Service started")

    brain = BrainState(max_events=200)
    graph = build_graph()

    while True:
        try:
            graph.invoke({
                "brain": brain,
                "decisions": []
            })

            # ✅ Clear memory window after reasoning cycle
            brain.clear()

            # ⏱️ Control reasoning frequency
            time.sleep(5)

        except Exception as e:
            print(f"❌ Master Brain error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    main()
