# resources.py

CRISIS_MESSAGE=(
    "If you're in immediate danger, please call 999.\n"
    "Samaritans (24/7): 116 123 - someone to talk to anytime. \n"
    "Shout (text): Text SHOUT to 85258 for free, confidential support. \n"
    "If you can, reach out to someone you trust and let them know how you feel. \n"
)

def all_resources()->str:
    """
    Returns the full crisis message.
    This makes it easy to print all helpliness from anywhere in the app
    """
    return CRISIS_MESSAGE