# Alice and Bob vs Casino Challenge

## The Game
Alice and Bob are playing a betting game against a casino with the following rules:
1. Alice places a 0/1 bet
2. Bob places a 0/1 bet
3. The casino reveals its pre-committed 0/1 bet
4. If all three bets match (A=B=C), Alice and Bob win. Otherwise, the casino wins.

## The Twist
- Bob has access to the casino's pre-committed sequence before the game starts
- After seeing the sequence, Bob cannot communicate with Alice
- Alice and Bob must develop a strategy beforehand

## Optimal Strategy
The optimal strategy guarantees a 50% win rate:
- Alice repeats Bob's previous bet
- Bob alternates between:
  - Even rounds: Play the current casino bet
  - Odd rounds: Play the next casino bet

## The Challenge
Design a logic circuit that generates Alice's bits 2-8 based on:
- Bob's bits 1-9
- Casino's bits 1-9

## Scoring System
The scoring script (`score.py`) evaluates your circuit by:
1. Testing all possible Casino sequences against all possible Bob sequences
2. For each Casino sequence (C), it finds the best Bob sequence (B) that maximizes wins
3. The final score is: Min_C Max_B Sum(A(i)=B(i+1)=C(i+1), i=1,...,8)

Note: Alice's first bit cannot be guaranteed to result in a win, as it has no previous information to work with.

## Usage
Run the scoring script:
```bash
python score.py --circuit path/to/circuit.cir --bits 9
```

The script will:
- Test all possible 9-bit combinations
- Show progress and current worst score
- Output the worst-case Casino sequence and the best Bob response
