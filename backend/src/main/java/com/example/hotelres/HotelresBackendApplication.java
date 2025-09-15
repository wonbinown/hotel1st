package com.example.hotelres;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class HotelresBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(HotelresBackendApplication.class, args);
	}

}
