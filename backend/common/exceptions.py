from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return response

    detail = response.data
    message = "Request failed"
    errors = None

    if isinstance(detail, dict):
        if "detail" in detail:
            message = detail["detail"]
        else:
            message = "Validation error"
            errors = detail
    elif isinstance(detail, list):
        errors = detail

    response.data = {"success": False, "message": message, "errors": errors}
    return response