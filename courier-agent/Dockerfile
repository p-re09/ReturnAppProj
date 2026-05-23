# 1. Use a lightweight Python base image
FROM python:3.9-slim

# 2. Set working dir
WORKDIR /app

# 3. Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir --pre -r requirements.txt

# 4. Copy the agent script
COPY agent.py .

# 5. Default entrypoint
ENTRYPOINT ["python", "agent.py"]
