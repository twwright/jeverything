from typesafe_sdk import (
    Choice,
    Noul,
    RetryPolicy,
    Score,
    TypeSafeAPIConnectionError,
    TypeSafeAPIError,
    TypeSafeClient,
)


def evaluate_ticket() -> None:
    with TypeSafeClient(
        model="jev-1.13.0",
        timeout=8.0,
        retry=RetryPolicy(max_retries=2, timeout=20.0),
    ) as client:
        result = client.system_one(
            state={
                "message": "My card was charged twice. Please refund one charge.",
                "account": {"refundEligible": True},
            },
            questions={
                "refund_intent": Noul(
                    instructions="Is the customer asking for a refund?",
                    criteria={
                        "true": "The customer asks to reverse or return a charge",
                        "false": "The customer does not ask to reverse or return a charge",
                    },
                ),
                "queue": Choice(
                    instructions="Which queue should handle this ticket?",
                    criteria={
                        "billing": "Charges, invoices, or refunds",
                        "technical": "Product behavior or errors",
                        "other": "None of the listed specialist queues",
                    },
                ),
                "frustration": Score(
                    instructions="How frustrated is the customer?",
                    criteria=[
                        "Calm and factual",
                        "Frustrated but civil",
                        "Very angry or threatening",
                    ],
                ),
            },
        )

        should_review_refund = result.nouls["refund_intent"].noul >= 0.85

        print(
            {
                "model": result.model,
                "request_id": result.request_id,
                "usage": result.usage.model_dump(),
                "queue": result.choices["queue"].choice,
                "queue_probabilities": result.choices["queue"].probabilities,
                "frustration": result.scores["frustration"].score,
                "should_review_refund": should_review_refund,
            }
        )


if __name__ == "__main__":
    try:
        evaluate_ticket()
    except TypeSafeAPIError as error:
        print(
            {
                "status": error.status,
                "request_id": error.request_id,
                "message": str(error),
            }
        )
        raise
    except TypeSafeAPIConnectionError as error:
        print({"message": str(error)})
        raise
