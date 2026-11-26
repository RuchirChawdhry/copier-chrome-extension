"""Drive real Chromium chrome via AT-SPI and X11 in a disposable CI desktop."""
import subprocess
import sys
import time

import pyatspi


def walk(node):
    try:
        yield node
        for child in node:
            yield from walk(child)
    except (RuntimeError, LookupError):
        return


def visible_nodes():
    for node in walk(pyatspi.Registry.getDesktop(0)):
        try:
            state = node.getState()
            if state.contains(pyatspi.STATE_SHOWING) and state.contains(pyatspi.STATE_VISIBLE):
                yield node, node.name, node.getRoleName()
        except (RuntimeError, LookupError):
            continue


def find(name, role, timeout=10):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        for node, label, actual_role in visible_nodes():
            if (label == name or (role == "toolbar" and label.startswith(name))) and (
                (role == "toolbar" and actual_role in ("push button", "toggle button", "button", "menu button"))
                or (role == "menu" and "menu item" in actual_role)
                or actual_role == role
            ):
                return node
        time.sleep(0.2)
    print("Visible accessibility nodes:", file=sys.stderr)
    for _, label, actual_role in visible_nodes():
        if label:
            print(actual_role, repr(label), file=sys.stderr)
    raise RuntimeError(f"Native control not found: {role} {name}")


def click(node, button):
    rect = node.queryComponent().getExtents(pyatspi.DESKTOP_COORDS)
    assert rect.width > 0 and rect.height > 0, rect
    x = rect.x + rect.width // 2
    y = rect.y + rect.height // 2
    subprocess.run(["xdotool", "mousemove", "--sync", str(x), str(y), "click", str(button)], check=True)


mode, *args = sys.argv[1:]
if mode == "click":
    role, name, button = args
    click(find(name, role), int(button))
elif mode == "verify":
    for name in args:
        node = find(name, "menu")
        print("Verified native menu item:", node.name)
else:
    raise ValueError(mode)
