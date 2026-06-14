from decimal import Decimal, ROUND_HALF_UP


MONEY_QUANTIZER = Decimal("0.01")


def quantize_money(value):
    return Decimal(value).quantize(MONEY_QUANTIZER, rounding=ROUND_HALF_UP)


def split_evenly(amount, count):
    amount = quantize_money(amount)
    base = (amount / count).quantize(MONEY_QUANTIZER, rounding=ROUND_HALF_UP)
    allocations = [base for _ in range(count)]
    remainder = amount - sum(allocations)
    index = 0
    step = Decimal("0.01") if remainder >= 0 else Decimal("-0.01")
    while remainder != 0:
        allocations[index] += step
        remainder -= step
        index = (index + 1) % count
    return allocations


def money_sum(values):
    return sum((quantize_money(value) for value in values), Decimal("0.00"))