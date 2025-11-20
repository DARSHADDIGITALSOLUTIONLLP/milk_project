-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: localhost    Database: mauli_dairy
-- ------------------------------------------------------
-- Server version	8.0.40

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin_registration`
--

DROP TABLE IF EXISTS `admin_registration`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_registration` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dairy_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `contact` varchar(20) NOT NULL,
  `address` varchar(255) NOT NULL,
  `payment_amount` decimal(10,2) DEFAULT NULL,
  `res_date` datetime DEFAULT NULL,
  `end_date` datetime NOT NULL,
  `periods` varchar(255) DEFAULT NULL,
  `cow_rate` float NOT NULL DEFAULT '0',
  `buffalo_rate` float NOT NULL DEFAULT '0',
  `pure_rate` float NOT NULL DEFAULT '0',
  `delivery_charges` float DEFAULT NULL,
  `qr_image` longblob COMMENT 'Binary data for the QR code image',
  `upi_address` varchar(255) DEFAULT NULL COMMENT 'UPI payment address',
  `bank_name` varchar(255) DEFAULT NULL COMMENT 'Bank name of the admin',
  `branch_name` varchar(255) DEFAULT NULL COMMENT 'Branch name of the bank',
  `account_number` varchar(50) DEFAULT NULL COMMENT 'Bank account number of the admin',
  `ifsc_code` varchar(20) DEFAULT NULL COMMENT 'IFSC code of the bank branch',
  `created_at` datetime NOT NULL,
  `request` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `dairy_name` (`dairy_name`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `contact` (`contact`),
  UNIQUE KEY `dairy_name_2` (`dairy_name`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `contact_2` (`contact`),
  UNIQUE KEY `dairy_name_3` (`dairy_name`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `contact_3` (`contact`),
  UNIQUE KEY `dairy_name_4` (`dairy_name`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `contact_4` (`contact`),
  UNIQUE KEY `account_number` (`account_number`),
  UNIQUE KEY `account_number_2` (`account_number`),
  UNIQUE KEY `account_number_3` (`account_number`),
  UNIQUE KEY `account_number_4` (`account_number`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_registration`
--

LOCK TABLES `admin_registration` WRITE;
/*!40000 ALTER TABLE `admin_registration` DISABLE KEYS */;
INSERT INTO `admin_registration` VALUES (1,'Dairy1','admin1@gmail.com','$2b$10$TMRB.Pf/XtJYuo7Af3uEyeXYI3PJcJN861XlV7jIlwT7DM.6b67q2','9876943213','123 Dairy Road',1000.00,'2025-02-19 00:00:00','2025-03-19 00:00:00','monthly',20,40,50,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-04-02 08:26:12',1);
/*!40000 ALTER TABLE `admin_registration` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_boys`
--

DROP TABLE IF EXISTS `delivery_boys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_boys` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `contact` varchar(20) NOT NULL,
  `address` varchar(255) NOT NULL,
  `dairy_name` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `status` tinyint(1) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `contact` (`contact`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `contact_2` (`contact`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `contact_3` (`contact`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `contact_4` (`contact`),
  KEY `dairy_name` (`dairy_name`),
  CONSTRAINT `delivery_boys_ibfk_1` FOREIGN KEY (`dairy_name`) REFERENCES `admin_registration` (`dairy_name`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_boys`
--

LOCK TABLES `delivery_boys` WRITE;
/*!40000 ALTER TABLE `delivery_boys` DISABLE KEYS */;
INSERT INTO `delivery_boys` VALUES (1,'delivery_boy1','delivery1@gmail.com','9876543217','123, Dairy Road, Pune','Dairy1','$2b$10$FE2HAsqeX3A4CLGUMd5aDuLCKdDQ2kDFnoouYw0jMPIERAO./VDK.',1,'2025-04-02 09:25:37');
/*!40000 ALTER TABLE `delivery_boys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deliverystatus`
--

DROP TABLE IF EXISTS `deliverystatus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deliverystatus` (
  `delivery_id` int NOT NULL AUTO_INCREMENT,
  `userid` int NOT NULL,
  `shift` enum('morning','evening') NOT NULL,
  `quantity_array` json NOT NULL,
  `date` date NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `timestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`delivery_id`),
  KEY `userid` (`userid`),
  CONSTRAINT `deliverystatus_ibfk_1` FOREIGN KEY (`userid`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deliverystatus`
--

LOCK TABLES `deliverystatus` WRITE;
/*!40000 ALTER TABLE `deliverystatus` DISABLE KEYS */;
INSERT INTO `deliverystatus` VALUES (1,1,'evening','\"[2.5,1.5,2]\"','2025-03-30',0,'2025-04-02 18:07:28'),(2,1,'evening','\"[2.5,0,0]\"','2025-03-30',0,'2025-04-02 18:07:42'),(3,1,'evening','\"[0,2,0]\"','2025-03-30',0,'2025-04-02 18:07:52'),(4,2,'evening','\"[0,2,1.5]\"','2025-03-27',0,'2025-04-02 19:08:45'),(5,2,'evening','\"[4,2,1.5]\"','2025-03-28',1,'2025-04-02 19:09:24'),(6,1,'morning','\"[5,3,2]\"','2025-04-03',1,'2025-04-03 04:15:08');
/*!40000 ALTER TABLE `deliverystatus` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `paymentdetails`
--

DROP TABLE IF EXISTS `paymentdetails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `paymentdetails` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `start_date` datetime NOT NULL,
  `userid` int NOT NULL,
  `received_payment` float NOT NULL DEFAULT '0',
  `pending_payment` float NOT NULL DEFAULT '0',
  `payment` float NOT NULL DEFAULT '0',
  `timestamp` datetime DEFAULT NULL,
  `delivery_charges` float NOT NULL DEFAULT '0',
  `month_year` varchar(7) NOT NULL,
  PRIMARY KEY (`payment_id`),
  KEY `userid` (`userid`),
  CONSTRAINT `paymentdetails_ibfk_1` FOREIGN KEY (`userid`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paymentdetails`
--

LOCK TABLES `paymentdetails` WRITE;
/*!40000 ALTER TABLE `paymentdetails` DISABLE KEYS */;
INSERT INTO `paymentdetails` VALUES (1,'2025-04-03 00:00:00',1,0,0,0,'2025-04-02 09:03:43',0,''),(2,'2025-04-01 00:00:00',1,340,0,340,'2025-04-02 18:42:00',0,'2025-03'),(3,'2025-04-04 00:00:00',2,0,0,0,'2025-04-02 19:02:54',0,'2025-04'),(4,'2025-04-01 00:00:00',2,390,390,390,'2025-04-02 19:10:01',0,'2025-03');
/*!40000 ALTER TABLE `paymentdetails` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `super_admin`
--

DROP TABLE IF EXISTS `super_admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `super_admin` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `contact` varchar(20) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `super_admin_email_unique` (`email`),
  UNIQUE KEY `super_admin_contact_unique` (`contact`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `super_admin`
--

LOCK TABLES `super_admin` WRITE;
/*!40000 ALTER TABLE `super_admin` DISABLE KEYS */;
/*!40000 ALTER TABLE `super_admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `contact` varchar(20) NOT NULL,
  `address` varchar(255) NOT NULL,
  `dairy_name` varchar(100) NOT NULL,
  `milk_type` enum('buffalo','cow','pure') NOT NULL,
  `quantity` float NOT NULL,
  `request` tinyint(1) NOT NULL DEFAULT '0',
  `start_date` date NOT NULL DEFAULT '2025-04-02',
  `delivered_morning` tinyint(1) NOT NULL DEFAULT '0',
  `delivered_evening` tinyint(1) NOT NULL DEFAULT '0',
  `vacation_mode_morning` tinyint(1) NOT NULL DEFAULT '0',
  `vacation_mode_evening` tinyint(1) NOT NULL DEFAULT '0',
  `advance_payment` float NOT NULL DEFAULT '0',
  `vacation_days` float NOT NULL DEFAULT '0',
  `qr_image` longblob COMMENT 'Binary data for the QR code image',
  `shift` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `contact` (`contact`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `contact_2` (`contact`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `contact_3` (`contact`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `contact_4` (`contact`),
  KEY `dairy_name` (`dairy_name`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`dairy_name`) REFERENCES `admin_registration` (`dairy_name`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Ankita Sawant','ankitasawant8998@gmail.com','$2b$10$6Eme.zWsCl3yBsBRL2W1o.ZA9XFQc1w0I3kYe0j8XVtKgNqQiUoj6','9876543210','Pune, Maharashtra','Dairy1','cow',5,1,'2025-04-03',1,0,0,0,60,0,NULL,'both','2025-04-02 08:51:16'),(2,'ashwini','ashwini@gmail.com','$2b$10$chixDX7SkGpOCmGtubozau6chqot5BdccXQn/8oQFoS.QI5jUTSmK','8234567890','123 Main Street, City, Country','Dairy1','cow',1.5,1,'2025-04-04',0,0,0,0,0,0,NULL,'both','2025-04-02 19:02:54');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vacations`
--

DROP TABLE IF EXISTS `vacations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vacations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `vacation_start` date NOT NULL,
  `vacation_end` date DEFAULT NULL,
  `shift` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `vacations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vacations`
--

LOCK TABLES `vacations` WRITE;
/*!40000 ALTER TABLE `vacations` DISABLE KEYS */;
/*!40000 ALTER TABLE `vacations` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-03 13:20:41
