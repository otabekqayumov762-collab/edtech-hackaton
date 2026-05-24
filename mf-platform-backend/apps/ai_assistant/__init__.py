"""AI assistant proxy app — canned rule-based chat responses.

This app provides a backend mirror of the frontend AI chat located at
``src/pages/app/AIAssistant.tsx``. Replies are produced by a small
rule-based service so that the API contract stays stable once a real
LLM is wired in.
"""
