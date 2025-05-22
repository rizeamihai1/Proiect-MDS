import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import make_pipeline
from sklearn.linear_model import LogisticRegression
import joblib

# Citirea datelor
df = pd.read_csv('E0.csv')

# Crearea etichetei pentru rezultat
def determinare_rezultat(row):
    if row['FTHG'] > row['FTAG']:
        return 'H'
    elif row['FTHG'] < row['FTAG']:
        return 'A'
    else:
        return 'D'

df['Result'] = df.apply(determinare_rezultat, axis=1)

# Selectarea caracteristicilor de interes
X = df[['HomeTeam', 'AwayTeam']]
y = df['Result']

# Împărțirea în seturi de antrenament și test
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Preprocesarea prin one-hot encoding
preprocessor = ColumnTransformer(
    transformers=[
        ('home', OneHotEncoder(handle_unknown='ignore'), ['HomeTeam']),
        ('away', OneHotEncoder(handle_unknown='ignore'), ['AwayTeam'])
    ]
)

# Construirea pipeline-ului: preprocesare + model
model = make_pipeline(preprocessor, LogisticRegression(max_iter=1000))

# Antrenarea modelului
model.fit(X_train, y_train)

# Salvarea modelului
joblib.dump(model, 'match_predictor_model.pkl')




# Încarcă modelul salvat
model = joblib.load('match_predictor_model.pkl')

# Meciurile din etapa 25 mai 
meciuri = pd.DataFrame({
    'HomeTeam': [
        'Crystal Palace', 'Manchester City', 'Bournemouth', 'Fulham',
        'Ipswich', 'Liverpool', 'Manchester United', 'Newcastle',
        'Nottingham Forest', 'Tottenham', 'Wolverhampton', 'Southampton'
    ],
    'AwayTeam': [
        'Wolverhampton', 'Bournemouth', 'Leicester', 'Manchester City',
        'West Ham', 'Crystal Palace', 'Aston Villa', 'Everton',
        'Chelsea', 'Brighton', 'Brentford', 'Arsenal'
    ]
})

# Prezice rezultatele
predictii = model.predict(meciuri)

# Afișează rezultatele
for i in range(len(meciuri)):
    gazda = meciuri.loc[i, 'HomeTeam']
    oaspete = meciuri.loc[i, 'AwayTeam']
    rezultat = predictii[i]
    print(f"Predicția pentru meciul {gazda} vs {oaspete} este: {rezultat}")

