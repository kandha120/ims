package IMS;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {"IMS"})
public class IMSApplication {

	public static void main(String[] args) {
		SpringApplication.run(IMSApplication.class, args);
	}

}
