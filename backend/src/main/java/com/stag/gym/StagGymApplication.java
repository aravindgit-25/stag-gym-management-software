package com.stag.gym;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class StagGymApplication {

	public static void main(String[] args) {
		SpringApplication.run(StagGymApplication.class, args);
	}

}
