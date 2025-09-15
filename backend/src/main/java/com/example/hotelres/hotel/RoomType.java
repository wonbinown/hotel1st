// src/main/java/com/example/hotelres/hotel/RoomType.java
package com.example.hotelres.hotel;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "room_types")
@Getter @Setter
public class RoomType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 소속 호텔 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hotel_id")          // FK: room_types.hotel_id
    private Hotel hotel;

    private String name;

    /** 테스트용 컬럼(테이블에 존재한다는 전제) */
    private Integer price;

    @Column(name = "today_remaining")
    private Integer todayRemaining;
}
