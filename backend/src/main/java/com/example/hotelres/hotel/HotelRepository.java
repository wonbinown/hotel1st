// src/main/java/com/example/hotelres/hotel/HotelRepository.java
package com.example.hotelres.hotel;

import org.springframework.data.jpa.repository.JpaRepository;

public interface HotelRepository extends JpaRepository<Hotel, Long> {
}
