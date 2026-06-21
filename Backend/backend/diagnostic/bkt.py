from typing import List


def run_bkt(
    answer_sequence: List[bool],
    p_known: float,
    p_learn: float,
    p_guess: float,
    p_slip: float
) -> float:
    """
    Runs Bayesian Knowledge Tracing over a sequence of answers.
    
    Parameters:
        answer_sequence : list of booleans [True=correct, False=incorrect]
        p_known         : prior probability student already knows (P_L0)
        p_learn         : probability of learning after each question (P_T)
        p_guess         : probability of guessing correctly (P_G)
        p_slip          : probability of knowing but answering wrong (P_S)
    
    Returns:
        float: final probability that student knows the subtopic (0.0 - 1.0)
    """
    p_know = p_known  # start with prior knowledge

    for is_correct in answer_sequence:

        # Step 1: likelihood of this answer given knows/doesn't know
        if is_correct:
            p_obs_given_know    = 1 - p_slip   # knew it and got it right
            p_obs_given_unknown = p_guess       # didn't know but guessed right
        else:
            p_obs_given_know    = p_slip        # knew it but slipped
            p_obs_given_unknown = 1 - p_guess   # didn't know and got it wrong

        # Step 2: total probability of this observation
        p_obs = (p_obs_given_know * p_know) + (p_obs_given_unknown * (1 - p_know))

        # Step 3: Bayesian update — P(knows | observation)
        if p_obs > 0:
            p_know = (p_obs_given_know * p_know) / p_obs

        # Step 4: learning transition — even if wrong, student may have learned
        p_know = p_know + (1 - p_know) * p_learn

        # Step 5: clamp to valid probability range
        p_know = max(0.0, min(1.0, p_know))

    return p_know


def classify_level(p_know: float) -> str:
    """
    Converts BKT probability to level.
    Thresholds tuned for A/L Chemistry S-block students.
    
    >= 0.80 : Advanced
    >= 0.50 : Intermediate
    <  0.50 : Beginner
    """
    if p_know >= 0.80:
        return "Advanced"
    elif p_know >= 0.50:
        return "Intermediate"
    else:
        return "Beginner"