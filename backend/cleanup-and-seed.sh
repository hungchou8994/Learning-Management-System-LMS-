#!/bin/bash
# Cleanup and seed script for both auth-service and elearn-db
# Usage: ./cleanup-and-seed.sh [courses] [students] [instructors]

set -e

echo "🧹 Starting cleanup and seed process..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get arguments
COURSES=${1:-20}
STUDENTS=${2:-15}
INSTRUCTORS=${3:-4}

echo -e "${BLUE}📊 Seed parameters:${NC}"
echo "   Courses: $COURSES"
echo "   Students: $STUDENTS"
echo "   Instructors: $INSTRUCTORS"
echo ""

# Cleanup auth-service
echo -e "${YELLOW}1️⃣  Cleaning up auth-service...${NC}"
cd auth-service
npm run cleanup:force
cd ..
echo -e "${GREEN}✅ Auth-service cleaned${NC}"
echo ""

# Cleanup elearn-db
echo -e "${YELLOW}2️⃣  Cleaning up elearn-db...${NC}"
cd elearn-db
npm run cleanup:force
cd ..
echo -e "${GREEN}✅ Elearn-db cleaned${NC}"
echo ""

# Seed elearn-db (which also seeds auth-service via API)
echo -e "${YELLOW}3️⃣  Seeding elearn-db (this will also seed auth-service)...${NC}"
cd elearn-db
npm run seed -- $COURSES $STUDENTS $INSTRUCTORS
cd ..
echo -e "${GREEN}✅ Seeding complete!${NC}"
echo ""

echo -e "${GREEN}🎉 All done!${NC}"

