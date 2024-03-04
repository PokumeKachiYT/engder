PYC=python

all:
	$(PYC) src/main.py

test:
	buildozer android debug deploy run
