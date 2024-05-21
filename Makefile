all:
	npx expo start

build:
	eas build -p android --profile preview
