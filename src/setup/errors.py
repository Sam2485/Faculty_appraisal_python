class AppError(Exception):
    """
    Raise when you need explicit control over the two-tier error message.

    user_message  Plain-English sentence shown directly in the UI.
    detail        Technical description shown in the network-tab response body
                  and written to GCP logs. Defaults to user_message when omitted.
    status_code   HTTP status code (default 400 for client errors, use 500 for
                  unexpected server failures).

    Example
    -------
    raise AppError(
        "Your appraisal could not be submitted. Please try again.",
        detail=f"shred_form KeyError on section key 'lectures_v2': {e}",
        status_code=500,
    )
    """

    def __init__(
        self,
        user_message: str,
        *,
        detail: str | None = None,
        status_code: int = 400,
    ) -> None:
        self.user_message = user_message
        self.detail = detail if detail is not None else user_message
        self.status_code = status_code
        super().__init__(self.detail)
