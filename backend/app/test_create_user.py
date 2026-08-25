from app.schemas import UserCreate
from app.crud import create_user

sample = UserCreate(
    full_name='Test Patient',
    email='test.patient@example.com',
    password='s3cur3pass',
    role='patient',
    phone='1234567890'
)

if __name__ == '__main__':
    user = create_user(sample)
    print('Created user id:', user.id, user.email)
