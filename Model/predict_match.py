import sys
from predictor_avansat import PredictorAvansat

def main():
    if len(sys.argv) != 3:
        print("Usage: python predict_match.py <HomeTeam> <AwayTeam>")
        sys.exit(1)

    home, away = sys.argv[1], sys.argv[2]
    predictor = PredictorAvansat()

    try:
        winner, conf, breakdown = predictor.predict(home, away)
        output = (
        f"{home} - {away}\n"
        f"{winner} cu probabilitate de {conf:.1f}%\n"
        f"Detaliu probabilități: {breakdown}\n\n"
        )

        print(output)

        with open("predictions.txt", "a", encoding="utf-8") as f:
            f.write(output)

    except ValueError as e:
        print("Eroare:", e)

    

if __name__ == "__main__":
    main()